# IndustryGPT Setup Guide

## 1. Creating Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Note your database password, you will need it later.

## 2. Enabling pgvector
1. In your Supabase dashboard, go to the SQL Editor.
2. Run the following command:
   ```sql
   create extension if not exists vector;
   ```

## 3. Creating database tables & RLS
We will provide database migrations under the `supabase/migrations` folder. 
You can run these scripts in your Supabase SQL editor.
(Instructions for migrations will be detailed here once the SQL files are generated).

## 4. Creating storage bucket
1. In your Supabase dashboard, go to Storage.
2. Create a new bucket called `documents`.
3. Set the bucket to Private.

## 5. Configuring authentication
1. Supabase Auth is enabled by default.
2. You can configure email/password settings under Auth -> Providers.

## 6. Adding environment variables
1. Copy `.env.example` to `.env`.
2. Fill in the values for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. You can find these in Project Settings -> API.

## 7. Getting Gemini API key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API key and add it to your `.env` as `GEMINI_API_KEY`.

## 8. Installing dependencies
**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## 9. Starting backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## 10. Starting frontend
```bash
cd frontend
npm run dev
```

## 11. Uploading first document
1. Go to the frontend URL (e.g., `http://localhost:5173`).
2. Create an account and log in.
3. Navigate to Documents and upload a sample industrial manual (PDF, TXT, or DOCX).

## 12. Testing RAG
1. Navigate to the Chat interface.
2. Ask a question related to your uploaded manual.
3. Verify that the system retrieves the correct information and provides citations.
