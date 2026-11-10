import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    GEMINI_API_KEY: str
    LLM_MODEL: str = "gemini-flash-lite-latest"
    EMBEDDING_MODEL: str = "gemini-embedding-2"

    @field_validator("SUPABASE_URL", mode="before")
    @classmethod
    def normalize_supabase_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("http://") and not v.startswith("https://"):
            if ".supabase.co" not in v:
                return f"https://{v}.supabase.co"
            return f"https://{v}"
        return v

    model_config = SettingsConfigDict(
        env_file=[str(ENV_PATH), ".env", "../.env"],
        extra="ignore"
    )

settings = Settings()
