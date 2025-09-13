from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer
from typing import List, Optional
from models import (
    PostcardCreateRequest,
    PostcardCreateResponse,
    PostcardUpdateRequest,
    PostcardUpdateResponse,
    PostcardDeleteResponse,
    PostcardPathResponse,
    NearbyPostcard,
    CollectResponse,
    PostcardDetail,
    LikeResponse,
    ErrorResponse,
)

router = APIRouter(prefix="/api/postcards", tags=["postcards"])
security = HTTPBearer()


async def get_current_user(_token: str = Depends(security)):
    return {"user_id": "placeholder_user_id"}


@router.post(
    "",
    response_model=PostcardCreateResponse,
    status_code=201,
    summary="絵葉書作成",
    description="新しいデジタル絵葉書を作成し、サーバーに保存します。このAPIは、絵葉書の画像をアップロードした後で呼び出されます。",
    responses={
        400: {"model": ErrorResponse, "description": "リクエストボディが不正な場合"},
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
    },
)
async def create_postcard(
    _postcard_data: PostcardCreateRequest,
    _current_user: dict = Depends(get_current_user),
):
    return PostcardCreateResponse(
        postcard_id="postcard_123", created_at="2024-01-01T00:00:00Z"
    )


@router.put(
    "/{postcard_id}",
    response_model=PostcardUpdateResponse,
    summary="絵葉書更新",
    description="ユーザーが作成した絵葉書の内容（テキスト、画像）を更新します。",
    responses={
        400: {"model": ErrorResponse, "description": "リクエストボディが不正な場合"},
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        403: {
            "model": ErrorResponse,
            "description": "他のユーザーの絵葉書を更新しようとした場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない場合",
        },
    },
)
async def update_postcard(
    postcard_id: str,
    _postcard_data: PostcardUpdateRequest,
    _current_user: dict = Depends(get_current_user),
):
    return PostcardUpdateResponse(
        message="絵葉書が更新されました。", postcard_id=postcard_id
    )


@router.delete(
    "/{postcard_id}",
    response_model=PostcardDeleteResponse,
    summary="絵葉書削除",
    description="ユーザーが作成した絵葉書を削除します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        403: {
            "model": ErrorResponse,
            "description": "他のユーザーの絵葉書を削除しようとした場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない場合",
        },
    },
)
async def delete_postcard(
    postcard_id: str, _current_user: dict = Depends(get_current_user)
):
    return PostcardDeleteResponse(
        message="絵葉書が削除されました。", postcard_id=postcard_id
    )


@router.get(
    "/{postcard_id}/path",
    response_model=PostcardPathResponse,
    tags=["travel"],
    summary="絵葉書の旅の軌跡取得",
    description="指定した絵葉書がこれまでに辿った旅の軌跡（経由地）を取得します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない場合",
        },
    },
)
async def get_postcard_path(
    postcard_id: str, _current_user: dict = Depends(get_current_user)
):
    return PostcardPathResponse(postcard_id=postcard_id, path=[])


@router.get(
    "/nearby",
    response_model=List[NearbyPostcard],
    tags=["tracking"],
    summary="近くの絵葉書取得",
    description="クライアントの現在地付近を通過中の、リレー中の絵葉書を取得します。このAPIは、クライアント側で定期的に呼び出されることを想定しています。",
    responses={
        400: {
            "model": ErrorResponse,
            "description": "lat または lon が欠けている、または不正な場合",
        },
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
    },
)
async def get_nearby_postcards(
    _lat: float = Query(..., description="クライアントの現在地の緯度"),
    _lon: float = Query(..., description="クライアントの現在地の経度"),
    _radius: Optional[int] = Query(None, description="検索範囲（半径、メートル単位）"),
    _current_user: dict = Depends(get_current_user),
):
    return []


@router.post(
    "/{postcard_id}/collect",
    response_model=CollectResponse,
    tags=["collection"],
    summary="絵葉書をコレクションに追加",
    description="地図上で見つけた絵葉書を「拾う」APIです。拾われた絵葉書はユーザーのコレクションに追加され、他のユーザーには表示されなくなります。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない、またはすでに拾われている場合",
        },
    },
)
async def collect_postcard(
    _postcard_id: str, _current_user: dict = Depends(get_current_user)
):
    return CollectResponse(message="絵葉書をコレクションに追加しました。")


@router.get(
    "/{postcard_id}",
    response_model=PostcardDetail,
    tags=["collection"],
    summary="絵葉書詳細取得",
    description="指定した絵葉書の詳細情報を取得します。コレクションから詳細画面を表示する際に利用します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない場合",
        },
    },
)
async def get_postcard_detail(
    postcard_id: str, _current_user: dict = Depends(get_current_user)
):
    return PostcardDetail(
        postcard_id=postcard_id,
        image_url="https://example.com/postcard.jpg",
        text="Example postcard text",
        created_at="2024-01-01T00:00:00Z",
        author_id="user_123",
        likes_count=0,
        path=[],
    )


@router.post(
    "/{postcard_id}/like",
    response_model=LikeResponse,
    tags=["collection"],
    summary="絵葉書にいいね",
    description="指定した絵葉書に「いいね」を押します。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
        404: {
            "model": ErrorResponse,
            "description": "指定した絵葉書IDが見つからない場合",
        },
        409: {
            "model": ErrorResponse,
            "description": "すでにいいね済みの絵葉書に再度いいねしようとした場合",
        },
    },
)
async def like_postcard(
    _postcard_id: str, _current_user: dict = Depends(get_current_user)
):
    return LikeResponse(message="いいね！が追加されました。")
