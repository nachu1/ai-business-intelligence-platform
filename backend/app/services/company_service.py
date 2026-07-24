from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from app.database.mongodb import company_collection
from app.schemas.company_schema import CompanyCreate


async def create_company(company: CompanyCreate):
    company_data = company.model_dump()
    company_data["created_at"] = datetime.utcnow()

    result = await company_collection.insert_one(company_data)

    company_data["id"] = str(result.inserted_id)

    return company_data


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