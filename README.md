# IndustryGPT

A Context-Aware Industrial Knowledge Assistant Using Transformer-Based NLP Models.

## Overview
IndustryGPT is a production-quality web application designed for industrial employees to upload technical documents and ask natural-language questions. It utilizes a Retrieval-Augmented Generation (RAG) architecture to provide context-aware, accurate, and grounded answers with source citations.

## Problem Statement
Industrial workers often spend excessive time searching through massive machine manuals, SOPs, and maintenance records to find specific procedures, safety guidelines, and operational limits. 

## Solution
IndustryGPT ingests technical documentation, extracts and chunks the text, and stores semantic embeddings in a vector database. Users can ask questions in natural language, and the system retrieves relevant chunks to ground the LLM's response, preventing hallucinations and ensuring safety.

## Features
- Secure document upload and management (PDF, TXT, DOCX).
- Semantic search across an industrial knowledge base.
- Context-aware conversational AI with memory.
- Verifiable source citations for all generated answers.
- User authentication and data isolation.

## Architecture
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Python, FastAPI, Pydantic, Uvicorn.
- **Database**: Supabase PostgreSQL with `pgvector`.
- **Auth & Storage**: Supabase Auth & Storage.
- **AI/LLM**: Gemini API for embeddings and text generation.

## RAG Pipeline
1. **Ingestion**: Documents are extracted, cleaned, and split into overlapping chunks (700-1000 tokens).
2. **Embedding**: Chunks are converted into vector representations using the Gemini embedding model.
3. **Retrieval**: User queries are embedded, and a cosine similarity search retrieves the top-K chunks.
4. **Generation**: The Gemini LLM generates a response constrained strictly to the retrieved context.

## Installation and Setup
Please refer to [SETUP.md](./SETUP.md) for detailed instructions on provisioning the Supabase project, obtaining a Gemini API key, and running the application locally.

## Security
- API keys are securely managed via backend environment variables.
- Supabase Row Level Security (RLS) ensures users can only access their own documents and chat histories.
- The AI is explicitly prompted to prioritize retrieved context over general knowledge and avoid hallucinating technical procedures.

## Limitations
- Scanned PDFs without embedded text may require future integration of OCR capabilities.
- Complex tables and diagrams within PDFs may not be perfectly extracted by standard libraries.

## Author
IndustryGPT was built to demonstrate a scalable, enterprise-grade AI solution for the industrial sector.
