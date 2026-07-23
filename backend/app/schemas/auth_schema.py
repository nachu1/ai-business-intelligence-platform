from pydantic import BaseModel, EmailStr, Field


class CompanyRegisterSchema(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100)
    owner_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)