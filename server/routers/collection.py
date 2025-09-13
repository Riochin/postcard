from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from typing import List
from models import PostcardInCollection, ErrorResponse
from database import db

router = APIRouter(prefix="/api/users/me", tags=["collection"])
security = HTTPBearer()


async def get_current_user(_token: str = Depends(security)):
    # TODO: Implement proper JWT token validation with Cognito
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
async def get_my_collection(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    collection = db.get_user_collection(user_id)

    # Convert to PostcardInCollection format
    result = []
    for item in collection:
        result.append(
            PostcardInCollection(
                postcard_id=item["postcard_id"],
                image_url=item["image_url"],
                text=item["text"],
                created_at=item["created_at"],
                author_id=item["author_id"],
                likes_count=item["likes_count"],
            )
        )

    return result
