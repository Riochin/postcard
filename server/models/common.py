from pydantic import BaseModel
from typing import Optional


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
