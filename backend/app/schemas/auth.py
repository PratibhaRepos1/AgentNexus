from uuid import UUID
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    business_name: str
    business_slug: str
    industry: str = "other"
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    business_id: UUID

    class Config:
        from_attributes = True
