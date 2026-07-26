from app.database.mongodb import company_collection
from app.schemas.auth_schema import CompanyRegisterSchema
from app.schemas.company_schema import CompanyCreate
from app.schemas.user_schema import UserCreate

from app.services.company_service import create_company
from app.services.user_service import (
    create_new_user,
    get_user_by_email
)

from app.auth.passwords import verify_password
from app.auth.security import create_access_token


async def register_company(data: CompanyRegisterSchema):

    # Check if email already exists
    existing_user = await get_user_by_email(data.email)

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists."
        }

    # Check if company already exists
    existing_company = await company_collection.find_one(
        {"name": data.company_name}
    )

    if existing_company:
        return {
            "success": False,
            "message": "Company already exists."
        }

    # Create company
    company = CompanyCreate(
        name=data.company_name,
        industry=data.industry,
        email=data.email,
        phone=data.phone,
        country=data.country,
        address=data.address
    )

    company_result = await create_company(company)

    # Create admin user
    user = UserCreate(
        company_id=company_result["id"],
        name=data.owner_name,
        email=data.email,
        password=data.password,
        role="admin"
    )

    await create_new_user(user)

    token = create_access_token(
        {
            "sub": data.email
        }
    )

    return {
        "success": True,
        "message": "Company registered successfully.",
        "access_token": token,
        "token_type": "bearer"
    }
async def login_user(data):

    user = await get_user_by_email(data.email)

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password."
        }

    if not verify_password(
        data.password,
        user["password_hash"]
    ):
        return {
            "success": False,
            "message": "Invalid email or password."
        }

    token = create_access_token(
        {
            "sub": user["email"]
        }
    )

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer"
    }