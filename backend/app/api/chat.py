from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from app.api.dependencies import get_current_user
from app.services.retrieval_service import search_similar_documents
from app.services.rag_service import generate_rag_response
from app.utils.supabase_client import get_supabase_client

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None
    language: str = "English"
    image_base64: Optional[str] = None

@router.get("/stats")
async def chat_stats(user = Depends(get_current_user)):
    """Return question/conversation stats for the current user."""
    supabase = get_supabase_client()
    try:
        messages_res = supabase.table("messages").select("id", count="exact").eq("user_id", user.id).eq("role", "user").execute()
        total_questions = messages_res.count if messages_res.count is not None else len(messages_res.data or [])
        conv_res = supabase.table("conversations").select("id", count="exact").eq("user_id", user.id).execute()
        total_convs = conv_res.count if conv_res.count is not None else len(conv_res.data or [])
        return {"total_questions": total_questions, "total_conversations": total_convs}
    except Exception as e:
        return {"total_questions": 0, "total_conversations": 0}

@router.get("/conversations")
async def list_conversations(user = Depends(get_current_user)):
    """List recent conversations for the current user."""
    supabase = get_supabase_client()
    res = supabase.table("conversations") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("updated_at", desc=True) \
        .limit(30) \
        .execute()
    return res.data or []

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, user = Depends(get_current_user)):
    """Get all messages for a specific conversation."""
    supabase = get_supabase_client()
    res = supabase.table("messages") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .eq("user_id", user.id) \
        .order("created_at", desc=False) \
        .execute()
    formatted = []
    for m in (res.data or []):
        formatted.append({
            "id": m.get("id"),
            "role": m.get("role"),
            "content": m.get("content"),
            "sources": m.get("citations") or [],
            "created_at": m.get("created_at")
        })
    return formatted

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user = Depends(get_current_user)):
    """Delete a conversation and its messages."""
    supabase = get_supabase_client()
    supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", user.id).execute()
    return {"status": "ok"}

@router.post("", include_in_schema=False)
@router.post("/")
async def chat(request: ChatRequest, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # 1. Manage Conversation Record
    conv_id = request.conversation_id
    title = (request.question[:45] + "...") if len(request.question) > 45 else request.question
    
    if not conv_id:
        try:
            conv_res = supabase.table("conversations").insert({
                "user_id": user.id,
                "title": title
            }).execute()
            if conv_res.data:
                conv_id = conv_res.data[0]["id"]
        except Exception as e:
            print(f"Error creating conversation: {e}")
    
    # Save User message to database
    if conv_id:
        try:
            supabase.table("messages").insert({
                "conversation_id": conv_id,
                "user_id": user.id,
                "role": "user",
                "content": request.question
            }).execute()
        except Exception as e:
            print(f"Error saving user message: {e}")

    # 2. Retrieve Context via pgvector
    relevant_chunks = search_similar_documents(
        request.question, 
        user.id, 
        match_threshold=0.3, 
        match_count=8, 
        document_id=request.document_id
    )
    
    # 3. Generate Answer
    sources = []
    if not relevant_chunks:
        answer = "I couldn't find enough relevant information in your uploaded documents to answer this reliably."
        has_safety_alert = False
    else:
        answer = generate_rag_response(
            request.question, 
            relevant_chunks, 
            language=request.language, 
            image_base64=request.image_base64
        )
        
        for chunk in relevant_chunks:
            doc_info = supabase.table("documents").select("filename").eq("id", chunk["document_id"]).execute()
            filename = doc_info.data[0]["filename"] if doc_info.data else "Unknown Document"
            
            sources.append({
                "document_id": chunk["document_id"],
                "filename": filename,
                "page": chunk.get("page_number", 1),
                "relevance": round(chunk.get("similarity", 1.0), 2),
                "chunk_content": chunk["content"][:200] + "..."
            })
            
        safety_keywords = ["danger", "warning", "hazard", "fatal", "toxic", "voltage", "flammable", "injury"]
        has_safety_alert = any(any(k in c["content"].lower() for k in safety_keywords) for c in relevant_chunks)
        
    # Save Assistant message to database
    if conv_id:
        try:
            supabase.table("messages").insert({
                "conversation_id": conv_id,
                "user_id": user.id,
                "role": "assistant",
                "content": answer,
                "citations": sources
            }).execute()
            # Update updated_at on conversation
            supabase.table("conversations").update({
                "title": title
            }).eq("id", conv_id).execute()
        except Exception as e:
            print(f"Error saving assistant message: {e}")
            
    return {
        "answer": answer,
        "sources": sources,
        "conversation_id": conv_id,
        "safety_alert": has_safety_alert
    }
