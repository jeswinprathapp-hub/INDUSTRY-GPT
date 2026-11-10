from app.utils.supabase_client import get_supabase_client
from app.services.embedding_service import generate_embedding

def search_similar_documents(query: str, user_id: str, match_threshold: float = 0.5, match_count: int = 5, document_id: str = None) -> list:
    """
    Embeds the user's query and performs a vector similarity search in the DB.
    """
    supabase = get_supabase_client()
    
    # Generate embedding for the query
    query_embedding = generate_embedding(query)
    if not query_embedding:
        return []
        
    try:
        # Call the Postgres RPC function we created in the migration
        result = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_threshold": match_threshold,
                "match_count": match_count,
                "p_user_id": user_id
            }
        ).execute()
        
        vector_chunks = result.data or []
        
        # Keyword Search (Full Text / ILIKE fallback for exact matches like 'E102')
        # We split the query into words, and if any word is an exact match (especially numbers/codes), we fetch it
        keyword_chunks = []
        words = query.split()
        significant_words = [w for w in words if len(w) > 3] # Filter out small stop words
        
        if significant_words:
            # We'll just do a basic OR search on the first significant keyword for demonstration
            # In production, use Postgres tsvector
            kw = significant_words[0]
            kw_res = supabase.table("document_chunks") \
                .select("id, document_id, chunk_index, content, page_number") \
                .eq("user_id", user_id) \
                .ilike("content", f"%{kw}%") \
                .limit(3) \
                .execute()
            
            if kw_res.data:
                # Assign a synthetic similarity score for keyword matches
                for row in kw_res.data:
                    row["similarity"] = 1.0 
                keyword_chunks = kw_res.data
                
        # Merge and deduplicate
        merged = {}
        for chunk in vector_chunks + keyword_chunks:
            chunk_id = chunk["id"]
            if chunk_id not in merged:
                merged[chunk_id] = chunk
            else:
                # If it's in both, boost the similarity
                merged[chunk_id]["similarity"] = min(1.0, merged[chunk_id].get("similarity", 0) + 0.1)
                
        # Apply document filter if provided
        final_list = list(merged.values())
        if document_id:
            final_list = [c for c in final_list if c["document_id"] == document_id]
            
        # Sort by similarity
        final_list.sort(key=lambda x: x.get("similarity", 0), reverse=True)
        
        return final_list[:match_count]
    except Exception as e:
        print(f"Error during vector search: {e}")
        return []
