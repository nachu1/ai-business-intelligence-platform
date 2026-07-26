from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    company_id: str
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "manager", "employee"]

    department: str
    designation: str



class UserUpdate(BaseModel):
    name: str
    role: Literal["admin", "manager", "employee"]
    department: str
    designation: str
    is_active: bool


class UserResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: EmailStr
    role: Literal["admin", "manager", "employee"]

    department: str
    designation: str

    is_active: bool
    created_at: datetime
