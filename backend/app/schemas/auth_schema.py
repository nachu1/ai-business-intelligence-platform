from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class CompanyRegisterSchema(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100)
    industry: str
    phone: str
    country: str
    address: Optional[str] = None
    owner_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    password: str = Field(..., min_length=8)
    confirm_password: str