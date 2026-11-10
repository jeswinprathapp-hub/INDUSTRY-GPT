import google.generativeai as genai
from app.config import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding for a given text chunk using Gemini."""
    try:
        result = genai.embed_content(
            model=f"models/{settings.EMBEDDING_MODEL}",
            content=text,
            task_type="retrieval_document",
            output_dimensionality=768
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

def generate_embeddings_batch(chunks: list[str]) -> list[list[float]]:
    """Generates embeddings for a batch of chunks."""
    embeddings = []
    for chunk in chunks:
        # Note: In production we'd use proper batching if the API supports it efficiently, 
        # but embed_content typically handles lists or we can just iterate.
        emb = generate_embedding(chunk)
        if emb:
            embeddings.append(emb)
    return embeddings
