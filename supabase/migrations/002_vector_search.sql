-- Function for vector similarity search
-- This function allows us to find the most relevant document chunks based on semantic similarity
-- We also filter by user_id to ensure users only search their own documents

create or replace function match_documents (
  query_embedding vector(768), -- Size matches Gemini embeddings
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  page_number int,
  section text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    document_chunks.page_number,
    document_chunks.section,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and document_chunks.user_id = p_user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
