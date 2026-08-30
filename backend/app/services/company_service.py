from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId

from app.auth.passwords import hash_password
from app.database.mongodb import (
    company_collection,
    user_collection,
)
from app.schemas.company_schema import CompanyCreate


async def create_company(company: CompanyCreate):
    company_data = {
        "name": company.name,
        "industry": company.industry,
        "email": company.email,
        "phone": company.phone,
        "country": company.country,
        "address": company.address,
        "created_at": datetime.utcnow(),
    }

    result = await company_collection.insert_one(
        company_data
    )

    company_id = result.inserted_id

    user_data = {
        "company_id": company_id,
        "name": company.owner_name,
        "email": company.email,
        "password_hash": hash_password(
            company.password
        ),
        "role": "admin",
        "department_id": None,
        "designation_id": None,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    await user_collection.insert_one(user_data)

    return {
        "id": str(company_id),
        "name": company.name,
        "industry": company.industry,
        "email": company.email,
        "phone": company.phone,
        "country": company.country,
        "address": company.address,
    }


async def get_company(company_id: str):
    try:
        company = await company_collection.find_one(
            {"_id": ObjectId(company_id)}
        )
    except InvalidId:
        return None

    if not company:
        return None

    company["id"] = str(company["_id"])
    del company["_id"]

    return company