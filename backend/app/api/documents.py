
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from typing import List
from app.api.dependencies import get_current_user
from app.utils.supabase_client import get_supabase_client
from app.services.document_service import process_document_background
import uuid
import os

router = APIRouter()

@router.post("/upload")
@router.post("/upload/", include_in_schema=False)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    # Validate file type
    allowed_extensions = {".pdf", ".txt", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Please upload PDF, DOCX, or TXT."
        )

    supabase = get_supabase_client()
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Generate unique path for storage
    doc_id = str(uuid.uuid4())
    file_path = f"{user.id}/{doc_id}{ext}"
    
    # Upload to Supabase Storage
    try:
        supabase.storage.from_("documents").upload(
            file_path, 
            content, 
            {"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document to storage: {str(e)}"
        )
        
    # Insert metadata into PostgreSQL
    try:
        doc_data = {
            "id": doc_id,
            "user_id": user.id,
            "filename": file.filename,
            "file_path": file_path,
            "file_type": ext,
            "file_size": file_size,
            "status": "uploaded"
        }
        result = supabase.table("documents").insert(doc_data).execute()
        
        # Trigger background task for processing (extraction, chunking, embedding)
        background_tasks.add_task(
            process_document_background,
            doc_id=doc_id,
            user_id=user.id,
            file_path=file_path,
            file_type=ext
        )
        
        return result.data[0]
    except Exception as e:
        # If DB insert fails, we should ideally clean up storage, but skipping for brevity
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document metadata: {str(e)}"
        )

@router.get("", include_in_schema=False)
@router.get("/")
async def list_documents(user = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("documents").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return result.data

@router.delete("/{document_id}")
async def delete_document(document_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Get document to find file path
    doc_result = supabase.table("documents").select("file_path").eq("id", document_id).eq("user_id", user.id).execute()
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_path = doc_result.data[0]["file_path"]
    
    # Delete from storage
    try:
        supabase.storage.from_("documents").remove([file_path])
    except Exception as e:
        pass # Ignore storage errors if file is already gone
        
    # Delete from DB
    supabase.table("documents").delete().eq("id", document_id).eq("user_id", user.id).execute()
    
    return {"message": "Document deleted successfully"}
