from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from models import (
    UserCreateRequest,
    UserCreateResponse,
    UserProfile,
    UserPublicProfile,
    UserUpdateRequest,
    UserUpdateResponse,
    UserDeleteResponse,
    ErrorResponse,
)
from database import db

router = APIRouter(prefix="/api/users", tags=["users"])
security = HTTPBearer()


async def get_current_user(_token: str = Depends(security)):
    # TODO: Implement proper JWT token validation with Cognito
    # For now, extract user_id from token or use placeholder
    return {"user_id": "placeholder_user_id", "email": "user@example.com"}


@router.post(
    "",
    response_model=UserCreateResponse,
    status_code=201,
    summary="ユーザープロフィール作成",
    description="Amazon Cognitoでの新規登録後、ユーザーのプロフィール情報を初めて作成する際に利用します。",
    responses={
        400: {"model": ErrorResponse, "description": "リクエストボディが不正な場合"},
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        409: {
            "model": ErrorResponse,
            "description": "すでにプロフィールが存在する場合",
        },
    },
)
async def create_user_profile(
    user_data: UserCreateRequest, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    email = current_user["email"]

    # Create user profile in database
    success = db.create_user(
        user_id=user_id,
        username=user_data.username,
        email=email,
        profile_image_url=user_data.profile_image_url,
    )

    if not success:
        raise HTTPException(
            status_code=409, detail="ユーザープロフィールは既に存在します。"
        )

    return UserCreateResponse(
        user_id=user_id, message="ユーザープロフィールが作成されました。"
    )


@router.get(
    "/me",
    response_model=UserProfile,
    summary="自身のユーザー情報取得",
    description="認証済みユーザー自身の情報を取得します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "ユーザープロフィールが見つからない場合",
        },
    },
)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    user = db.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=404, detail="ユーザープロフィールが見つかりません。"
        )

    return UserProfile(
        user_id=user["user_id"],
        username=user["username"],
        email=user["email"],
        profile_image_url=user["profile_image_url"],
    )


@router.get(
    "/{user_id}",
    response_model=UserPublicProfile,
    summary="他のユーザー情報取得",
    description="指定した user_id のユーザー情報を取得します。他のユーザーのプロフィール閲覧に利用します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定したユーザーIDが見つからない場合",
        },
    },
)
async def get_user_profile(
    user_id: str, _current_user: dict = Depends(get_current_user)
):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=404, detail="指定したユーザーIDが見つかりません。"
        )

    return UserPublicProfile(
        user_id=user["user_id"],
        username=user["username"],
        profile_image_url=user["profile_image_url"],
    )


@router.put(
    "/me",
    response_model=UserUpdateResponse,
    summary="自身のユーザー情報更新",
    description="認証済みユーザー自身の情報を更新します。",
    responses={
        400: {"model": ErrorResponse, "description": "リクエストボディが不正な場合"},
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
    },
)
async def update_my_profile(
    user_data: UserUpdateRequest, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    success = db.update_user(
        user_id=user_id,
        username=user_data.username,
        profile_image_url=user_data.profile_image_url,
    )

    if not success:
        raise HTTPException(
            status_code=404, detail="ユーザープロフィールが見つかりません。"
        )

    return UserUpdateResponse(message="ユーザー情報が更新されました。", user_id=user_id)


@router.delete(
    "/me",
    response_model=UserDeleteResponse,
    summary="自身のユーザー削除",
    description="認証済みユーザー自身を削除します。**注意: この操作は取り消せません。**",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        }
    },
)
async def delete_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="ユーザープロフィールが見つかりません。"
        )

    return UserDeleteResponse(message="ユーザーが削除されました。")
