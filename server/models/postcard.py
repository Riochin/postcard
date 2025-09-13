from pydantic import BaseModel
from typing import List
from .travel import PathPoint


class PostcardCreateRequest(BaseModel):
    image_url: str
    text: str
    lat: float
    lon: float


class PostcardCreateResponse(BaseModel):
    postcard_id: str
    created_at: str


class PostcardUpdateRequest(BaseModel):
    image_url: str
    text: str


class PostcardUpdateResponse(BaseModel):
    message: str
    postcard_id: str


class PostcardDeleteResponse(BaseModel):
    message: str
    postcard_id: str


class PostcardDetail(BaseModel):
    postcard_id: str
    image_url: str
    text: str
    created_at: str
    author_id: str
    likes_count: int
    path: List[PathPoint]
