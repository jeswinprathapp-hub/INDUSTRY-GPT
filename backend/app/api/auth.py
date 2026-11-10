from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "user_metadata": user.user_metadata
    }
