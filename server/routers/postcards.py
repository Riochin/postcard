from fastapi import APIRouter, Depends, Query, HTTPException
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
    UserPostcardsResponse,
    ErrorResponse,
)
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/postcards", tags=["postcards"])


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
    postcard_data: PostcardCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    author_id = current_user["user_id"]

    # 認証済みユーザーの詳細情報をDBから取得
    author = db.get_user(author_id)
    if not author:
        raise HTTPException(
            status_code=404,
            detail="ユーザープロフィールが見つかりません。ユーザープロフィールを先に作成してください。",
        )

    result = db.create_postcard(
        author_id=author_id,
        image_url=postcard_data.image_url,
        text=postcard_data.text,
        lat=postcard_data.lat,
        lon=postcard_data.lon,
    )

    return PostcardCreateResponse(
        postcard_id=result["postcard_id"], created_at=result["created_at"]
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
    postcard_data: PostcardUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    # Check if postcard exists and user owns it
    postcard = db.get_postcard(postcard_id)
    if not postcard:
        raise HTTPException(
            status_code=404, detail="指定した絵葉書IDが見つからない場合"
        )

    if postcard["author_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=403, detail="他のユーザーの絵葉書を更新しようとした場合"
        )

    success = db.update_postcard(
        postcard_id=postcard_id,
        image_url=postcard_data.image_url,
        text=postcard_data.text,
    )

    if not success:
        raise HTTPException(status_code=400, detail="絵葉書の更新に失敗しました。")

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
    postcard_id: str, current_user: dict = Depends(get_current_user)
):
    # Check if postcard exists and user owns it
    postcard = db.get_postcard(postcard_id)
    if not postcard:
        raise HTTPException(
            status_code=404, detail="指定した絵葉書IDが見つからない場合"
        )

    if postcard["author_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=403, detail="他のユーザーの絵葉書を削除しようとした場合"
        )

    success = db.delete_postcard(postcard_id)
    if not success:
        raise HTTPException(status_code=400, detail="絵葉書の削除に失敗しました。")

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
    # Check if postcard exists
    postcard = db.get_postcard(postcard_id)
    if not postcard:
        raise HTTPException(
            status_code=404, detail="指定した絵葉書IDが見つからない場合"
        )

    path = db.get_postcard_path(postcard_id)
    return PostcardPathResponse(postcard_id=postcard_id, path=path)


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
    lat: float = Query(..., description="クライアントの現在地の緯度"),
    lon: float = Query(..., description="クライアントの現在地の経度"),
    radius: Optional[int] = Query(1000, description="検索範囲（半径、メートル単位）"),
    _current_user: dict = Depends(get_current_user),
):
    nearby_postcards = db.get_nearby_postcards(lat, lon, radius)
    return nearby_postcards


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
    postcard_id: str, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    success = db.collect_postcard(user_id, postcard_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="指定した絵葉書IDが見つからない、またはすでに拾われている場合",
        )

    return CollectResponse(message="絵葉書をコレクションに追加しました。")


@router.get(
    "/my",
    response_model=UserPostcardsResponse,
    tags=["user"],
    summary="自分の投稿した絵葉書取得",
    description="ログイン中のユーザーが投稿した全ての絵葉書を取得します。作成日時の新しい順に並びます。",
    responses={
        401: {
            "model": ErrorResponse,
            "description": "認証トークンがない、または無効な場合",
        },
    },
)
async def get_my_postcards(current_user: dict = Depends(get_current_user)):
    """Get all postcards created by the current user"""
    user_id = current_user["user_id"]

    postcards_data = db.get_user_postcards(user_id)

    return UserPostcardsResponse(postcards=postcards_data, count=len(postcards_data))


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
    postcard_id: str, current_user: dict = Depends(get_current_user)
):
    postcard = db.get_postcard(postcard_id)
    if not postcard:
        raise HTTPException(
            status_code=404, detail="指定した絵葉書IDが見つからない場合"
        )

    path = db.get_postcard_path(postcard_id)

    return PostcardDetail(
        postcard_id=postcard["postcard_id"],
        image_url=postcard["image_url"],
        text=postcard["text"],
        created_at=postcard["created_at"],
        author_id=postcard["author_id"],
        likes_count=postcard["likes_count"],
        path=path,
        is_own=postcard["author_id"] == current_user["user_id"],
        current_position={
            "lat": float(postcard["current_lat"]),
            "lon": float(postcard["current_lon"]),
        }
        if postcard.get("current_lat") and postcard.get("current_lon")
        else None,
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
    postcard_id: str, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    # Check if postcard exists
    postcard = db.get_postcard(postcard_id)
    if not postcard:
        raise HTTPException(
            status_code=404, detail="指定した絵葉書IDが見つからない場合"
        )

    success = db.like_postcard(user_id, postcard_id)
    if not success:
        raise HTTPException(
            status_code=409,
            detail="すでにいいね済みの絵葉書に再度いいねしようとした場合",
        )

    return LikeResponse(message="いいね！が追加されました。")
