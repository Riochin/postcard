from pydantic import BaseModel


class UserCreateRequest(BaseModel):
    username: str
    profile_image_url: str


class UserCreateResponse(BaseModel):
    user_id: str
    message: str


class UserProfile(BaseModel):
    user_id: str
    username: str
    email: str
    profile_image_url: str


class UserPublicProfile(BaseModel):
    user_id: str
    username: str
    profile_image_url: str


class UserUpdateRequest(BaseModel):
    username: str
    profile_image_url: str


class UserUpdateResponse(BaseModel):
    message: str
    user_id: str


class UserDeleteResponse(BaseModel):
    message: str
