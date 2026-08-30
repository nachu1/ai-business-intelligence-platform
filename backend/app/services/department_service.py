from bson import ObjectId
from bson.errors import InvalidId

from app.database.mongodb import (
    department_collection,
    designation_collection,
    user_collection,
)

from app.models.department import create_department


# =========================================================
# CREATE DEPARTMENT
# =========================================================

async def create_new_department(
    company_id: ObjectId,
    name: str,
):
    name = name.strip()

    # Check if an active/inactive department with
    # the same name already exists
    existing_department = await department_collection.find_one(
        {
            "company_id": company_id,
            "name": {
                "$regex": f"^{name}$",
                "$options": "i",
            },
        }
    )

    if existing_department:
        return None

    department_data = create_department(
        company_id=company_id,
        name=name,
    )

    result = await department_collection.insert_one(
        department_data
    )

    department_data["id"] = str(
        result.inserted_id
    )

    return department_data


# =========================================================
# GET COMPANY DEPARTMENTS
# =========================================================

async def get_company_departments(
    company_id: ObjectId,
):
    departments = []

    cursor = (
        department_collection
        .find(
            {
                "company_id": company_id,
                "is_active": True,
            }
        )
        .sort("name", 1)
    )

    async for department in cursor:

        departments.append(
            {
                "id": str(
                    department["_id"]
                ),
                "name": department["name"],
                "is_active": department["is_active"],
            }
        )

    return departments


# =========================================================
# GET SINGLE DEPARTMENT
# =========================================================

async def get_department(
    department_id: str,
    company_id: ObjectId,
):
    try:
        department_object_id = ObjectId(
            department_id
        )
    except (InvalidId, TypeError):
        return None

    department = await department_collection.find_one(
        {
            "_id": department_object_id,
            "company_id": company_id,
        }
    )

    if not department:
        return None

    return {
        "id": str(
            department["_id"]
        ),
        "name": department["name"],
        "is_active": department["is_active"],
    }


# =========================================================
# DEACTIVATE DEPARTMENT
# =========================================================

async def deactivate_department(
    department_id: str,
    company_id: ObjectId,
):
    try:
        department_object_id = ObjectId(department_id)
    except (InvalidId, TypeError):
        return False

    # Check if users are assigned to this department
    assigned_users = await user_collection.count_documents(
        {
            "company_id": company_id,
            "department_id": department_object_id,
            "is_active": True,
        }
    )

    if assigned_users > 0:
        return "users_assigned"

    # Deactivate department
    result = await department_collection.update_one(
        {
            "_id": department_object_id,
            "company_id": company_id,
            "is_active": True,
        },
        {
            "$set": {
                "is_active": False,
            }
        },
    )

    if result.modified_count == 0:
        return False

    # Deactivate its designations
    await designation_collection.update_many(
        {
            "company_id": company_id,
            "department_id": department_object_id,
            "is_active": True,
        },
        {
            "$set": {
                "is_active": False,
            }
        },
    )

    return True