from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from typing import List
from models import PostcardInCollection, ErrorResponse

router = APIRouter(prefix="/api/users/me", tags=["collection"])
security = HTTPBearer()


async def get_current_user(_token: str = Depends(security)):
    return {"user_id": "placeholder_user_id"}


@router.get(
    "/collection",
    response_model=List[PostcardInCollection],
    summary="自身のコレクション取得",
    description="ログイン中のユーザーが拾った絵葉書のコレクション一覧を取得します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        }
    },
)
async def get_my_collection(_current_user: dict = Depends(get_current_user)):
    return []
