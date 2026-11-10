import fitz  # PyMuPDF
from docx import Document
import io

def extract_text_from_pdf(content: bytes) -> list:
    """Extracts text from PDF and returns a list of dictionaries with page numbers and text."""
    pages_data = []
    try:
        # Open the PDF from bytes
        pdf_document = fitz.open(stream=content, filetype="pdf")
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            if text.strip():
                pages_data.append({
                    "page_number": page_num + 1,
                    "content": text
                })
        return pages_data
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return []

def extract_text_from_docx(content: bytes) -> list:
    """Extracts text from DOCX."""
    try:
        doc = Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return [{"page_number": 1, "content": text}]
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return []

def extract_text_from_txt(content: bytes) -> list:
    """Extracts text from TXT."""
    try:
        text = content.decode('utf-8', errors='replace')
        return [{"page_number": 1, "content": text}]
    except Exception as e:
        print(f"Error extracting TXT: {e}")
        return []

def process_document_content(content: bytes, file_type: str) -> list:
    """Router for document extraction based on file type."""
    file_type = file_type.lower()
    if file_type == '.pdf':
        return extract_text_from_pdf(content)
    elif file_type == '.docx':
        return extract_text_from_docx(content)
    elif file_type == '.txt':
        return extract_text_from_txt(content)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
