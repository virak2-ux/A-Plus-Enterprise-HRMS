from typing import Generic, TypeVar, List, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = "Operation successful"
    data: Optional[T] = None
    meta: Optional[dict] = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
