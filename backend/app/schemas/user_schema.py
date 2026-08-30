from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class UserCreate(BaseModel):
    company_id: str

    name: str
    email: EmailStr
    password: str

    role: Literal[
        "admin",
        "manager",
        "employee",
    ]

    department_id: str
    designation_id: str


class UserUpdate(BaseModel):
    name: str

    role: Literal[
        "admin",
        "manager",
        "employee",
    ]

    department_id: str
    designation_id: str

    is_active: bool


class UserResponse(BaseModel):
    id: str
    company_id: str

    name: str
    email: EmailStr

    role: Literal[
        "admin",
        "manager",
        "employee",
    ]

    department_id: str
    designation_id: str

    # Names are still returned for displaying
    # in the Users table.
    department: str
    designation: str
    manager_id: str | None = None

    is_active: bool
    created_at: datetime

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str
