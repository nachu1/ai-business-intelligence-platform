from pydantic import BaseModel, EmailStr
from typing import Optional


class CompanyCreate(BaseModel):
    name: str
    industry: str
    email: EmailStr
    phone: str
    country: str
    address: Optional[str] = None


class CompanyResponse(CompanyCreate):
    id: str