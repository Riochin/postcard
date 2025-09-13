from pydantic import BaseModel


class CollectResponse(BaseModel):
    message: str


class PostcardInCollection(BaseModel):
    postcard_id: str
    image_url: str
    text: str
    created_at: str
    author_id: str
    likes_count: int


class LikeResponse(BaseModel):
    message: str
