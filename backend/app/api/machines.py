from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.api.dependencies import get_current_user
from app.utils.supabase_client import get_supabase_client
import uuid

router = APIRouter()

class MachineCreate(BaseModel):
    name: str
    machine_code: Optional[str] = None
    machine_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "Operational"

class LinkDocument(BaseModel):
    document_id: str

class MaintenanceRecordCreate(BaseModel):
    maintenance_type: str
    description: str
    technician: Optional[str] = None
    status: Optional[str] = "Completed"
    action_taken: Optional[str] = None

@router.get("", include_in_schema=False)
@router.get("/")
async def list_machines(user = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("machines").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return result.data

@router.post("", include_in_schema=False)
@router.post("/")
async def create_machine(machine: MachineCreate, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    data = machine.model_dump()
    data["user_id"] = user.id
    result = supabase.table("machines").insert(data).execute()
    return result.data[0]

@router.get("/{machine_id}")
async def get_machine(machine_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Get Machine Profile
    result = supabase.table("machines").select("*").eq("id", machine_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    machine_data = result.data[0]
    
    # Get linked documents
    docs = supabase.table("documents").select("id, filename, document_type, status, created_at").eq("machine_id", machine_id).execute()
    machine_data["documents"] = docs.data
    
    # Get maintenance records
    maint = supabase.table("maintenance_records").select("*").eq("machine_id", machine_id).order("date", desc=True).execute()
    machine_data["maintenance_records"] = maint.data
    
    return machine_data

@router.delete("/{machine_id}")
async def delete_machine(machine_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    supabase.table("machines").delete().eq("id", machine_id).eq("user_id", user.id).execute()
    return {"message": "Machine deleted successfully"}

@router.post("/{machine_id}/link-document")
async def link_document(machine_id: str, req: LinkDocument, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Verify machine belongs to user
    m_check = supabase.table("machines").select("id").eq("id", machine_id).eq("user_id", user.id).execute()
    if not m_check.data:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    # Update document to link to this machine
    result = supabase.table("documents").update({"machine_id": machine_id}).eq("id", req.document_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to link document")
        
    return result.data[0]

@router.post("/{machine_id}/maintenance")
async def create_maintenance_record(machine_id: str, req: MaintenanceRecordCreate, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Verify machine belongs to user
    m_check = supabase.table("machines").select("id").eq("id", machine_id).eq("user_id", user.id).execute()
    if not m_check.data:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    data = req.model_dump()
    data["machine_id"] = machine_id
    data["user_id"] = user.id
    import datetime
    data["date"] = datetime.datetime.now().isoformat()
    
    result = supabase.table("maintenance_records").insert(data).execute()
    return result.data[0]
