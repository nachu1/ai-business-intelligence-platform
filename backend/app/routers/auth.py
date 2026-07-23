from fastapi import APIRouter
from app.schemas.auth_schema import CompanyRegisterSchema
from app.services.auth_service import register_company

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(data: CompanyRegisterSchema):
    return register_company(data)