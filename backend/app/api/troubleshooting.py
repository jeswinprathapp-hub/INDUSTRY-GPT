from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.api.dependencies import get_current_user
from app.utils.supabase_client import get_supabase_client
from app.services.retrieval_service import search_similar_documents
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

router = APIRouter()

class TroubleshootingRequest(BaseModel):
    machine_id: str
    symptoms: str

SYSTEM_PROMPT = """
You are an expert Industrial Troubleshooting Assistant.
A user has reported a problem with a specific machine.
Using the symptoms provided by the user and the context extracted from the machine's manuals and maintenance records, provide a step-by-step Root Cause Analysis (RCA) and troubleshooting guide.

Rules:
1. ONLY rely on the provided context. If the context does not contain enough info, state that clearly and offer general industrial troubleshooting advice as a fallback, but clearly mark it as general advice.
2. Structure your response with:
   - **Initial Assessment**: Brief summary of the likely issue.
   - **Safety Warnings**: ANY safety hazards related to these symptoms based on the manuals.
   - **Step-by-Step Troubleshooting**: Actionable steps to diagnose and fix the issue.
3. Be concise and professional.
"""

@router.post("", include_in_schema=False)
@router.post("/")
async def diagnose(request: TroubleshootingRequest, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Verify machine belongs to user
    m_check = supabase.table("machines").select("id, name, manufacturer, model").eq("id", request.machine_id).eq("user_id", user.id).execute()
    if not m_check.data:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    machine = m_check.data[0]
    
    # Fetch all document IDs linked to this machine
    docs = supabase.table("documents").select("id").eq("machine_id", request.machine_id).execute()
    doc_ids = [d["id"] for d in (docs.data or [])]
    
    # Retrieve relevant chunks using the user's symptoms as the search query
    relevant_chunks = search_similar_documents(request.symptoms, user.id, match_threshold=0.25, match_count=15)
    
    # Filter strictly to machine's docs, or fallback to all relevant chunks
    machine_chunks = [c for c in relevant_chunks if c.get("document_id") in doc_ids] if doc_ids else []
    chunks_to_use = machine_chunks[:5] if machine_chunks else relevant_chunks[:5]
    
    # Build context
    context_str = f"Machine: {machine['name']} ({machine.get('manufacturer', '')} {machine.get('model', '')})\n\n"
    for i, chunk in enumerate(chunks_to_use):
        context_str += f"--- Source from Manual ---\n{chunk.get('content', '')}\n\n"
        
    # Get Maintenance records as additional context
    maint = supabase.table("maintenance_records").select("description, date, action_taken").eq("machine_id", request.machine_id).order("created_at", desc=True).limit(5).execute()
    if maint.data:
        context_str += "--- Recent Maintenance Records ---\n"
        for rec in maint.data:
            context_str += f"Date: {rec.get('date')} | Issue: {rec.get('description')} | Action: {rec.get('action_taken')}\n"

    # Generate Response
    prompt = f"""
    Context Information:
    {context_str}
    
    User Reported Symptoms:
    {request.symptoms}
    """
    
    candidate_models = [
        settings.LLM_MODEL,
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ]
    
    answer = None
    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_PROMPT
            )
            response = model.generate_content(prompt)
            if response and response.text:
                answer = response.text
                break
        except Exception as e:
            print(f"Troubleshooting model {model_name} failed: {e}")
            
    if not answer:
        answer = "I encountered an error trying to diagnose this issue. Please check system logs."
        
    return {
        "diagnosis": answer,
        "machine_name": machine["name"]
    }
