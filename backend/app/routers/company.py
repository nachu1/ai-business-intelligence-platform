from fastapi import APIRouter, HTTPException

from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.services.company_service import create_company, get_company

router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)


@router.post("/", response_model=CompanyResponse)
async def add_company(company: CompanyCreate):
    return await create_company(company)


@router.get("/{company_id}", response_model=CompanyResponse)
async def fetch_company(company_id: str):
    company = await get_company(company_id)

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    return company