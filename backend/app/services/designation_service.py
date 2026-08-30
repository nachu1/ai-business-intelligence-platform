from bson import ObjectId
from bson.errors import InvalidId

from app.database.mongodb import (
    department_collection,
    designation_collection,
    user_collection,
)

from app.models.designation import create_designation


# =========================================================
# CREATE DESIGNATION
# =========================================================

async def create_new_designation(
    company_id: ObjectId,
    department_id: str,
    name: str,
):
    name = name.strip()

    # -----------------------------------------------------
    # Validate department ID
    # -----------------------------------------------------

    try:
        department_object_id = ObjectId(
            department_id
        )
    except (InvalidId, TypeError):
        return None

    # -----------------------------------------------------
    # Make sure department exists, belongs to company,
    # and is active
    # -----------------------------------------------------

    department = await department_collection.find_one(
        {
            "_id": department_object_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return None

    # -----------------------------------------------------
    # Check duplicate designation
    # -----------------------------------------------------

    existing_designation = (
        await designation_collection.find_one(
            {
                "company_id": company_id,
                "department_id": department_object_id,
                "name": {
                    "$regex": f"^{name}$",
                    "$options": "i",
                },
            }
        )
    )

    if existing_designation:
        return None

    # -----------------------------------------------------
    # Create designation
    # -----------------------------------------------------

    designation_data = create_designation(
        company_id=company_id,
        department_id=department_object_id,
        name=name,
    )

    result = await designation_collection.insert_one(
        designation_data
    )

    designation_data["id"] = str(
        result.inserted_id
    )

    designation_data["department_id"] = str(
        designation_data["department_id"]
    )

    return designation_data


# =========================================================
# GET DEPARTMENT DESIGNATIONS
# =========================================================

async def get_department_designations(
    company_id: ObjectId,
    department_id: str,
):
    try:
        department_object_id = ObjectId(
            department_id
        )
    except (InvalidId, TypeError):
        return []

    # -----------------------------------------------------
    # Make sure department belongs to company
    # -----------------------------------------------------

    department = await department_collection.find_one(
        {
            "_id": department_object_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return []

    # -----------------------------------------------------
    # Get active designations
    # -----------------------------------------------------

    designations = []

    cursor = (
        designation_collection
        .find(
            {
                "company_id": company_id,
                "department_id": department_object_id,
                "is_active": True,
            }
        )
        .sort("name", 1)
    )

    async for designation in cursor:

        designations.append(
            {
                "id": str(
                    designation["_id"]
                ),
                "department_id": str(
                    designation["department_id"]
                ),
                "name": designation["name"],
                "is_active": designation["is_active"],
            }
        )

    return designations


# =========================================================
# DEACTIVATE DESIGNATION
# =========================================================

async def deactivate_designation(
    designation_id: str,
    company_id: ObjectId,
):
    try:
        designation_object_id = ObjectId(
            designation_id
        )
    except (InvalidId, TypeError):
        return {
            "success": False,
            "reason": "invalid_id",
        }

    # -----------------------------------------------------
    # CHECK IF DESIGNATION EXISTS
    # -----------------------------------------------------

    designation = await designation_collection.find_one(
        {
            "_id": designation_object_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not designation:
        return {
            "success": False,
            "reason": "not_found",
        }

    # -----------------------------------------------------
    # CHECK IF USERS ARE ASSIGNED
    # -----------------------------------------------------

    assigned_user = await user_collection.find_one(
        {
            "company_id": company_id,
            "designation_id": designation_object_id,
            "is_active": True,
        }
    )

    if assigned_user:
        return {
            "success": False,
            "reason": "users_assigned",
        }

    # -----------------------------------------------------
    # DEACTIVATE DESIGNATION
    # -----------------------------------------------------

    result = await designation_collection.update_one(
        {
            "_id": designation_object_id,
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
        return {
            "success": False,
            "reason": "not_found",
        }

    return {
        "success": True,
        "reason": "deleted",
    }