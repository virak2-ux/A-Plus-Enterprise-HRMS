from typing import Optional, List
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RoleSimple(BaseModel):
    id: str
    code: str
    name: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    company_id: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool
    is_superuser: bool
    preferred_language: str
    roles: List[str] = []
    permissions: List[str] = []

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
