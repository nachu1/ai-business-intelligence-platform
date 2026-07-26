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


async def get_employee_analytics(company_id: str):
    company_filter = {
        "company_id": ObjectId(company_id)
    }

    total_users = await user_collection.count_documents(company_filter)

    active_users = await user_collection.count_documents(
        {
            **company_filter,
            "is_active": True,
        }
    )

    inactive_users = await user_collection.count_documents(
        {
            **company_filter,
            "is_active": False,
        }
    )

    role_pipeline = [
        {
            "$match": company_filter
        },
        {
            "$group": {
                "_id": "$role",
                "count": {
                    "$sum": 1
                }
            }
        }
    ]

    role_result = await user_collection.aggregate(
        role_pipeline
    ).to_list(None)

    role_distribution = {
        item["_id"]: item["count"]
        for item in role_result
    }

    department_pipeline = [
        {
            "$match": company_filter
        },
        {
            "$group": {
                "_id": "$department",
                "count": {
                    "$sum": 1
                }
            }
        }
    ]

    department_result = await user_collection.aggregate(
        department_pipeline
    ).to_list(None)

    department_distribution = {
        item["_id"]: item["count"]
        for item in department_result
    }

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "role_distribution": role_distribution,
        "department_distribution": department_distribution,
    }