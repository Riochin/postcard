from fastapi import APIRouter, Depends
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

router = APIRouter(prefix="/api/users", tags=["users"])
security = HTTPBearer()


async def get_current_user(_token: str = Depends(security)):
    return {"user_id": "placeholder_user_id"}


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
    _user_data: UserCreateRequest, _current_user: dict = Depends(get_current_user)
):
    return UserCreateResponse(
        user_id="user_123", message="ユーザープロフィールが作成されました。"
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
async def get_my_profile(_current_user: dict = Depends(get_current_user)):
    return UserProfile(
        user_id="user_123",
        username="example_user",
        email="user@example.com",
        profile_image_url="https://example.com/profile.jpg",
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
    return UserPublicProfile(
        user_id=user_id,
        username="example_user",
        profile_image_url="https://example.com/profile.jpg",
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
    _user_data: UserUpdateRequest, _current_user: dict = Depends(get_current_user)
):
    return UserUpdateResponse(
        message="ユーザー情報が更新されました。", user_id="user_123"
    )


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
async def delete_my_profile(_current_user: dict = Depends(get_current_user)):
    return UserDeleteResponse(message="ユーザーが削除されました。")
