from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document_pages(pages_data: list, chunk_size: int = 800, chunk_overlap: int = 150) -> list:
    """
    Takes a list of dictionaries with page_number and content,
    and returns a list of chunk dictionaries.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = []
    chunk_index = 0
    
    for page in pages_data:
        page_number = page.get("page_number")
        content = page.get("content")
        
        # Split text into chunks
        page_chunks = text_splitter.split_text(content)
        
        for pc in page_chunks:
            chunks.append({
                "chunk_index": chunk_index,
                "content": pc,
                "page_number": page_number,
            })
            chunk_index += 1
            
    return chunks
