from bson import ObjectId

from app.database.mongodb import company_collection, user_collection


async def get_dashboard_summary(company_id: str):
    company = await company_collection.find_one(
        {"_id": ObjectId(company_id)}
    )

    total_users = await user_collection.count_documents(
        {"company_id": ObjectId(company_id)}
    )

    admins = await user_collection.count_documents(
        {
            "company_id": ObjectId(company_id),
            "role": "admin",
        }
    )

    managers = await user_collection.count_documents(
        {
            "company_id": ObjectId(company_id),
            "role": "manager",
        }
    )

    employees = await user_collection.count_documents(
        {
            "company_id": ObjectId(company_id),
            "role": "employee",
        }
    )

    return {
    "company_name": company["name"],
    "industry": company["industry"],
    "total_users": total_users,
    "admins": admins,
    "managers": managers,
    "employees": employees,
}