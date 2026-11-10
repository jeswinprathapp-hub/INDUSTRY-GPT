import json
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def analyze_document_content(text_content: str) -> dict:
    """
    Analyzes the extracted text of a document to generate classification,
    summary, key topics, and FAQs.
    """
    prompt = f"""
    You are an industrial document analyzer. Analyze the following document text and extract the requested intelligence.
    
    Respond STRICTLY in JSON format with no markdown wrappers or other text.
    
    Required JSON structure:
    {{
        "document_type": "SOP | Machine Manual | Maintenance Report | Safety Document | Technical Specification | Inspection Report | Troubleshooting Guide | Training Document | Other",
        "classification_confidence": 0.95,
        "summary": "A concise 2-3 sentence summary of the document",
        "key_topics": ["topic1", "topic2", "topic3"],
        "faqs": [
            {{"question": "Q1", "answer": "A1"}},
            {{"question": "Q2", "answer": "A2"}}
        ]
    }}
    
    Document text (truncated for analysis):
    {text_content[:20000]}
    """
    
    candidate_models = [
        settings.LLM_MODEL,
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ]
    
    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if not response or not response.text:
                continue
            result_text = response.text.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            elif result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            return json.loads(result_text)
        except Exception as e:
            print(f"Error analyzing document with {model_name}: {e}")
            continue
            
    return {
        "document_type": "Other",
        "classification_confidence": 0.0,
        "summary": "Could not analyze document.",
        "key_topics": [],
        "faqs": []
    }
