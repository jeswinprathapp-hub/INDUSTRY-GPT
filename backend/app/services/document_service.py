from app.utils.supabase_client import get_supabase_client
from app.services.extraction_service import process_document_content
from app.services.chunking_service import chunk_document_pages
from app.services.embedding_service import generate_embedding
from app.services.ai_service import analyze_document_content
import asyncio

async def process_document_background(doc_id: str, user_id: str, file_path: str, file_type: str):
    """
    Background task to orchestrate extraction, chunking, and embedding.
    """
    supabase = get_supabase_client()
    
    try:
        # 1. Update status to processing
        supabase.table("documents").update({"status": "processing"}).eq("id", doc_id).execute()
        
        # 2. Download file from Storage
        storage_response = supabase.storage.from_("documents").download(file_path)
        content_bytes = storage_response
        
        # 3. Extract text
        pages_data = process_document_content(content_bytes, file_type)
        page_count = len(pages_data) if file_type == '.pdf' else 1
        
        # 3.5 Analyze Document Intelligence (non-blocking)
        try:
            full_text = "\n".join([page["content"] for page in pages_data])
            analysis = analyze_document_content(full_text)
            supabase.table("documents").update({
                "page_count": page_count,
                "document_type": analysis.get("document_type", "Other"),
                "classification_confidence": analysis.get("classification_confidence", 0.0),
                "summary": analysis.get("summary", ""),
                "key_topics": analysis.get("key_topics", [])
            }).eq("id", doc_id).execute()
            
            faqs = analysis.get("faqs", [])
            if faqs:
                faq_records = [{"document_id": doc_id, "question": faq.get("question", ""), "answer": faq.get("answer", "")} for faq in faqs]
                supabase.table("document_faqs").insert(faq_records).execute()
        except Exception as ai_err:
            print(f"Document intelligence optional analysis skipped for {doc_id}: {ai_err}")
            try:
                supabase.table("documents").update({"page_count": page_count}).eq("id", doc_id).execute()
            except Exception:
                pass
        
        # 5. Chunk text
        chunks = chunk_document_pages(pages_data)
        
        # 6. Generate embeddings and store in DB
        chunk_records = []
        for chunk in chunks:
            # Generate embedding
            embedding = generate_embedding(chunk["content"])
            
            # Prepare record
            record = {
                "document_id": doc_id,
                "user_id": user_id,
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"],
                "embedding": embedding,
                "page_number": chunk.get("page_number"),
            }
            chunk_records.append(record)
            
        # Bulk insert chunks (Note: Supabase has limits on bulk insert sizes, you might want to batch this)
        batch_size = 50
        for i in range(0, len(chunk_records), batch_size):
            batch = chunk_records[i:i + batch_size]
            supabase.table("document_chunks").insert(batch).execute()
            
        # 7. Update status to processed
        supabase.table("documents").update({"status": "processed"}).eq("id", doc_id).execute()
        
    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        # Update status to failed
        supabase.table("documents").update({"status": "failed"}).eq("id", doc_id).execute()
