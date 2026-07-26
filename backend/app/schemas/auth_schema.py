from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class CompanyRegisterSchema(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100)
    industry: str
    phone: str
    country: str
    address: Optional[str] = None

    owner_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


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