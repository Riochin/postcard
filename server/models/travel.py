from pydantic import BaseModel
from typing import List


class Position(BaseModel):
    lat: float
    lon: float


class PathPoint(BaseModel):
    prefecture: str
    lat: float
    lon: float
    arrival_time: str


class PostcardPathResponse(BaseModel):
    postcard_id: str
    path: List[PathPoint]


class NearbyPostcard(BaseModel):
    postcard_id: str
    image_url: str
    text: str
    current_position: Position
    next_destination: Position
    last_updated_at: str
