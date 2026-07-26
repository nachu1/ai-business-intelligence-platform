from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    company_id: str
    name: str
    email: EmailStr
    password: str
    role: str


class UserResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: EmailStr
    role: str
    is_active: bool