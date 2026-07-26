from fastapi import APIRouter

from app.schemas.auth_schema import (
    CompanyRegisterSchema,
    LoginSchema,
)

from app.services.auth_service import (
    register_company,
    login_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
async def register(data: CompanyRegisterSchema):
    return await register_company(data)


@router.post("/login")
async def login(data: LoginSchema):
    return await login_user(data)