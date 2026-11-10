from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import auth, documents, chat, machines, troubleshooting, maintenance, analytics

app = FastAPI(title="IndustryGPT API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "IndustryGPT API is running."}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(machines.router, prefix="/api/machines", tags=["machines"])
app.include_router(troubleshooting.router, prefix="/api/troubleshooting", tags=["troubleshooting"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["maintenance"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
