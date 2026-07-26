from pydantic import BaseModel, EmailStr
from typing import Literal


class UserCreate(BaseModel):
    company_id: str
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "manager", "employee"]


class UserResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: EmailStr
    role: Literal["admin", "manager", "employee"]
    is_active: bool