from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase_client import get_supabase_client

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user
    except Exception as e:
        pass

    # Fallback to anon client if service role key is invalid/unavailable
    try:
        from supabase import create_client
        from app.config import settings
        anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        user_response = anon_client.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user
    except Exception as e:
        print(f"Auth verification error: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
