from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.dependencies import get_current_user
from app.utils.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/stats")
async def get_stats(user = Depends(get_current_user)) -> Dict[str, Any]:
    supabase = get_supabase_client()
    
    # We will get counts. Supabase JS has .select('*', { count: 'exact', head: true })
    # In python sdk, we can select('id', count='exact')
    
    # Machines
    machines_res = supabase.table("machines").select("id", count="exact").eq("user_id", user.id).execute()
    total_machines = machines_res.count if machines_res.count is not None else len(machines_res.data)
    
    # Documents
    docs_res = supabase.table("documents").select("id", count="exact").eq("user_id", user.id).execute()
    total_documents = docs_res.count if docs_res.count is not None else len(docs_res.data)
    
    # Maintenance Tasks (for user's machines)
    m_ids = [m["id"] for m in supabase.table("machines").select("id").eq("user_id", user.id).execute().data]
    pending_tasks = 0
    completed_tasks = 0
    if m_ids:
        try:
            pending_res = supabase.table("maintenance_tasks").select("id", count="exact").in_("machine_id", m_ids).eq("status", "Pending").execute()
            completed_res = supabase.table("maintenance_tasks").select("id", count="exact").in_("machine_id", m_ids).eq("status", "Completed").execute()
            pending_tasks = pending_res.count if pending_res.count is not None else len(pending_res.data)
            completed_tasks = completed_res.count if completed_res.count is not None else len(completed_res.data)
        except Exception:
            try:
                rec_res = supabase.table("maintenance_records").select("id, status").in_("machine_id", m_ids).execute()
                recs = rec_res.data or []
                completed_tasks = len([r for r in recs if r.get("status") == "Completed"])
                pending_tasks = len([r for r in recs if r.get("status") != "Completed"])
            except Exception:
                pending_tasks = 0
                completed_tasks = 0
        
    return {
        "total_machines": total_machines,
        "total_documents": total_documents,
        "pending_tasks": pending_tasks,
        "completed_tasks": completed_tasks
    }

@router.get("/audit-logs")
async def get_audit_logs(user = Depends(get_current_user)) -> List[Dict[str, Any]]:
    supabase = get_supabase_client()
    # Fetch recent audit logs for the user
    logs = supabase.table("audit_logs").select("*").eq("user_id", user.id).order("created_at", desc=True).limit(20).execute()
    return logs.data
