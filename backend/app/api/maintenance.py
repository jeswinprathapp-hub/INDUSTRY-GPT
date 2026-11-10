from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.api.dependencies import get_current_user
from app.utils.supabase_client import get_supabase_client
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

router = APIRouter()

class MaintenanceTaskCreate(BaseModel):
    machine_id: str
    task_name: str
    description: Optional[str] = None
    due_date: str
    priority: str = "Medium"

@router.get("/tasks")
async def get_tasks(user = Depends(get_current_user)):
    supabase = get_supabase_client()
    machines = supabase.table("machines").select("id, name").eq("user_id", user.id).execute()
    machine_ids = [m["id"] for m in machines.data]
    
    if not machine_ids:
        return []
    
    machine_map = {m["id"]: m["name"] for m in machines.data}
    
    try:
        tasks = supabase.table("maintenance_tasks").select("*, machines(name)").in_("machine_id", machine_ids).order("due_date", desc=False).execute()
        return tasks.data
    except Exception:
        # Fallback to maintenance_records
        records = supabase.table("maintenance_records").select("*").in_("machine_id", machine_ids).order("created_at", desc=False).execute()
        formatted_tasks = []
        for r in (records.data or []):
            st = "Completed" if r.get("status") == "Completed" else "Pending"
            due = r.get("next_due_date") or r.get("date") or (r.get("created_at") or "")[:10]
            desc = r.get("description", "")
            title = r.get("maintenance_type") or (desc[:30] if desc else "Maintenance Task")
            formatted_tasks.append({
                "id": r["id"],
                "machine_id": r.get("machine_id"),
                "task_name": title,
                "description": desc,
                "due_date": str(due)[:10],
                "priority": "Medium",
                "status": st,
                "machines": {"name": machine_map.get(r.get("machine_id"), "Machine")}
            })
        return formatted_tasks

@router.post("/tasks")
async def create_task(task: MaintenanceTaskCreate, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    m_check = supabase.table("machines").select("id").eq("id", task.machine_id).eq("user_id", user.id).execute()
    if not m_check.data:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        new_task = supabase.table("maintenance_tasks").insert({
            "machine_id": task.machine_id,
            "task_name": task.task_name,
            "description": task.description,
            "due_date": task.due_date,
            "priority": task.priority,
            "status": "Pending",
            "assigned_to": user.id
        }).execute()
        return new_task.data[0]
    except Exception:
        # Fallback to maintenance_records
        new_record = supabase.table("maintenance_records").insert({
            "machine_id": task.machine_id,
            "user_id": user.id,
            "maintenance_type": task.task_name,
            "description": task.description or task.task_name,
            "date": datetime.utcnow().isoformat(),
            "next_due_date": task.due_date,
            "status": "Scheduled"
        }).execute()
        rec = new_record.data[0]
        return {
            "id": rec["id"],
            "machine_id": rec["machine_id"],
            "task_name": task.task_name,
            "description": task.description,
            "due_date": task.due_date,
            "priority": task.priority,
            "status": "Pending"
        }

@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    try:
        updated = supabase.table("maintenance_tasks").update({"status": "Completed"}).eq("id", task_id).execute()
        if updated.data:
            return updated.data[0]
    except Exception:
        pass
    
    updated = supabase.table("maintenance_records").update({"status": "Completed"}).eq("id", task_id).execute()
    return updated.data[0] if updated.data else {"id": task_id, "status": "Completed"}

@router.post("/report/generate")
async def generate_report(user = Depends(get_current_user)):
    supabase = get_supabase_client()
    machines = supabase.table("machines").select("id, name").eq("user_id", user.id).execute()
    machine_ids = [m["id"] for m in machines.data]
    
    if not machine_ids:
        return {"report": "No machines found. Please add a machine to generate a report."}
        
    machine_map = {m["id"]: m["name"] for m in machines.data}
    
    # Get last month's records
    records = supabase.table("maintenance_records").select("*").in_("machine_id", machine_ids).order("created_at", desc=True).limit(20).execute()
    
    # Get upcoming tasks
    tasks_data = []
    try:
        tasks = supabase.table("maintenance_tasks").select("*").in_("machine_id", machine_ids).eq("status", "Pending").order("due_date", desc=False).limit(10).execute()
        tasks_data = tasks.data or []
    except Exception:
        tasks_data = [r for r in (records.data or []) if r.get("status") != "Completed"]
    
    context_str = "--- Recent Maintenance Records ---\n"
    for r in (records.data or []):
        m_name = machine_map.get(r.get("machine_id"), "Unknown Machine")
        context_str += f"[{m_name}] {r.get('date') or r.get('created_at')} - {r.get('maintenance_type')}: {r.get('description')} (Action: {r.get('action_taken')})\n"
        
    context_str += "\n--- Upcoming Scheduled Tasks ---\n"
    for t in tasks_data:
        m_name = machine_map.get(t.get("machine_id"), "Unknown Machine")
        t_name = t.get("task_name") or t.get("maintenance_type") or t.get("description", "Task")
        context_str += f"[{m_name}] Due {t.get('due_date') or t.get('next_due_date')} - {t_name} (Priority: {t.get('priority', 'Medium')})\n"

    SYSTEM_PROMPT = """
    You are an expert Industrial Operations Manager. 
    You have been provided with raw data regarding recent maintenance records and upcoming scheduled tasks for a facility.
    Your job is to generate a professional, structured Operations & Maintenance (O&M) Summary Report in Markdown.
    
    The report should include:
    1. **Executive Summary**: A brief paragraph summarizing the overall health and activity.
    2. **Completed Maintenance Highlights**: Call out significant repairs or trends.
    3. **Upcoming Critical Tasks**: Highlight tasks that need immediate attention.
    4. **Recommendations**: General advice based on the data (e.g. "Consider replacing seals on Machine A due to repeated repairs").
    
    Keep it concise and business-professional.
    """
    
    try:
        model = genai.GenerativeModel(
            model_name=settings.LLM_MODEL,
            system_instruction=SYSTEM_PROMPT
        )
        response = model.generate_content(f"Data:\n{context_str}")
        report = response.text
    except Exception as e:
        print(f"Error generating report: {e}")
        report = "Failed to generate report due to an AI service error."
        
    return {"report": report}
