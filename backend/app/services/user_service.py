from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId

from fastapi import HTTPException
from app.auth.passwords import hash_password, verify_password

from app.auth.passwords import hash_password

from app.database.mongodb import (
    user_collection,
    department_collection,
    designation_collection,
)

from app.models.user import create_user

from app.schemas.user_schema import (
    UserCreate,
    UserUpdate,
)


# =========================================================
# HELPERS
# =========================================================

def convert_object_id(value: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


# =========================================================
# CREATE USER
# =========================================================

async def create_new_user(
    user: UserCreate,
):
    company_id = convert_object_id(
        user.company_id
    )

    department_id = convert_object_id(
        user.department_id
    )

    designation_id = convert_object_id(
        user.designation_id
    )

    manager_id = None

    if user.manager_id:
        manager_id = convert_object_id(
            user.manager_id
        )

    if not company_id:
        return None

    if not department_id:
        return None

    if not designation_id:
        return None

    if user.manager_id and not manager_id:
        return None

    department = await department_collection.find_one(
        {
            "_id": department_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return None

    designation = await designation_collection.find_one(
        {
            "_id": designation_id,
            "company_id": company_id,
            "department_id": department_id,
            "is_active": True,
        }
    )

    if not designation:
        return None

    if manager_id:
        manager = await user_collection.find_one(
            {
                "_id": manager_id,
                "company_id": company_id,
                "role": "manager",
                "department_id": department_id,
                "is_active": True,
            }
        )

        if not manager:
            return None

    user_data = create_user(
        company_id=company_id,
        name=user.name,
        email=user.email,
        password_hash=hash_password(
            user.password
        ),
        role=user.role,
        department_id=department_id,
        department_name=department["name"],
        designation_id=designation_id,
        designation_name=designation["name"],
        manager_id=manager_id,
    )

    result = await user_collection.insert_one(
        user_data
    )

    return await get_user(
        str(result.inserted_id)
    )
   

# =========================================================
# GET USER
# =========================================================

async def get_user(
    user_id: str,
):
    object_id = convert_object_id(
        user_id
    )

    if not object_id:
        return None

    user = await user_collection.find_one(
        {
            "_id": object_id
        }
    )

    if not user:
        return None

    return await build_user_response(
        user
    )


# =========================================================
# BUILD USER RESPONSE
# =========================================================

async def build_user_response(user):
    department = None
    designation = None

    if user.get("department_id"):
        department = await department_collection.find_one(
            {
                "_id": user["department_id"]
            }
        )

    if user.get("designation_id"):
        designation = await designation_collection.find_one(
            {
                "_id": user["designation_id"]
            }
        )

    return {
        "id": str(user["_id"]),
        "company_id": str(user["company_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],

        "department_id": (
            str(user["department_id"])
            if user.get("department_id")
            else ""
        ),

        "designation_id": (
            str(user["designation_id"])
            if user.get("designation_id")
            else ""
        ),
        "manager_id": (
           str(user["manager_id"])
           if user.get("manager_id")
           else None
        ),

        "department": (
            department["name"]
            if department
            else ""
        ),

        "designation": (
            designation["name"]
            if designation
            else ""
        ),

        "is_active": user["is_active"],
        "created_at": user["created_at"],
    }


# =========================================================
# GET USER BY EMAIL
# =========================================================

async def get_user_by_email(
    email: str,
):
    return await user_collection.find_one(
        {
            "email": email
        }
    )


# =========================================================
# COMPANY USERS
# =========================================================

async def get_company_users(
    company_id: str,
    search: str = None,
    role: str = None,
    department: str = None,
    page: int = 1,
    limit: int = 10,
    current_user_role: str = "admin",
):
    company_object_id = convert_object_id(
        company_id
    )

    if not company_object_id:
        return []

    query = {
        "company_id": company_object_id
    }

    # Managers cannot see admins
    # in the company users page.
    if current_user_role == "manager":
        query["role"] = {
            "$ne": "admin"
        }

    if search:
        query["$or"] = [
            {
                "name": {
                    "$regex": search,
                    "$options": "i",
                }
            },
            {
                "email": {
                    "$regex": search,
                    "$options": "i",
                }
            },
        ]

    if role:
        # Prevent managers from bypassing
        # the admin restriction through
        # the role filter.
        if (
            current_user_role == "manager"
            and role == "admin"
        ):
            return []

        query["role"] = role

    if department:
        department_object_id = (
            convert_object_id(
                department
            )
        )

        if department_object_id:
            query["department_id"] = (
                department_object_id
            )
        else:
            query["department_id"] = None

    skip = (
        page - 1
    ) * limit

    cursor = (
        user_collection
        .find(query)
        .skip(skip)
        .limit(limit)
    )

    users = []

    async for user in cursor:
        users.append(
            await build_user_response(
                user
            )
        )

    return users


# =========================================================
# COMPANY USER STATISTICS
# =========================================================

async def get_company_user_stats(
    company_id: str,
):
    company_object_id = convert_object_id(
        company_id
    )

    if not company_object_id:
        return {
            "total_users": 0,
            "administrators": 0,
            "managers": 0,
            "employees": 0,
        }

    total_users = (
        await user_collection.count_documents(
            {
                "company_id":
                    company_object_id
            }
        )
    )

    administrators = (
        await user_collection.count_documents(
            {
                "company_id":
                    company_object_id,
                "role": "admin",
            }
        )
    )

    managers = (
        await user_collection.count_documents(
            {
                "company_id":
                    company_object_id,
                "role": "manager",
            }
        )
    )

    employees = (
        await user_collection.count_documents(
            {
                "company_id":
                    company_object_id,
                "role": "employee",
            }
        )
    )

    return {
        "total_users": total_users,
        "administrators": administrators,
        "managers": managers,
        "employees": employees,
    }


# =========================================================
# COMPANY DEPARTMENTS
# =========================================================

async def get_company_departments(
    company_id: str,
):
    company_object_id = convert_object_id(
        company_id
    )

    if not company_object_id:
        return []

    departments = (
        await department_collection
        .find(
            {
                "company_id":
                    company_object_id,
                "is_active": True,
            }
        )
        .sort("name", 1)
        .to_list(length=None)
    )

    return [
        {
            "id": str(
                department["_id"]
            ),
            "name": department["name"],
        }
        for department in departments
    ]


# =========================================================
# UPDATE USER
# =========================================================

async def update_user(
    user_id: str,
    user: UserUpdate,
):
    user_object_id = convert_object_id(
        user_id
    )

    department_id = convert_object_id(
        user.department_id
    )

    designation_id = convert_object_id(
        user.designation_id
    )

    if not user_object_id:
        return None

    if not department_id:
        return None

    if not designation_id:
        return None

    existing_user = (
        await user_collection.find_one(
            {
                "_id": user_object_id
            }
        )
    )

    if not existing_user:
        return None

    company_id = existing_user[
        "company_id"
    ]

    department = await department_collection.find_one(
        {
            "_id": department_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return None

    designation = await designation_collection.find_one(
        {
            "_id": designation_id,
            "company_id": company_id,
            "department_id": department_id,
            "is_active": True,
        }
    )

    if not designation:
        return None

    manager_id = None

    if user.role == "employee":
        manager_object_id = convert_object_id(
            user.manager_id
        )

        if not manager_object_id:
            return None

        manager = await user_collection.find_one(
            {
                "_id": manager_object_id,
                "company_id": company_id,
                "department_id": department_id,
                "role": "manager",
                "is_active": True,
            }
        )

        if not manager:
            return None

        manager_id = manager_object_id
    

    await user_collection.update_one(
        {
            "_id": user_object_id
        },
        {
            "$set": {
               "name": user.name,
               "role": user.role,

               "department_id": department_id,
               "department_name": department["name"],

               "designation_id": designation_id,
               "designation_name": designation["name"],

               "manager_id": manager_id,

               "is_active": user.is_active,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return await get_user(
        user_id
    )


# =========================================================
# DELETE USER
# =========================================================

async def delete_user(
    user_id: str,
):
    user_object_id = convert_object_id(
        user_id
    )

    if not user_object_id:
        return False

    result = await user_collection.delete_one(
        {
            "_id": user_object_id
        }
    )

    return (
        result.deleted_count > 0
    )

async def change_user_password(
    user_id: str,
    current_password: str,
    new_password: str,
    confirm_password: str,
):
    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="New passwords do not match.",
        )

    if current_password == new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password.",
        )

    user = await user_collection.find_one(
        {"_id": convert_object_id(user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not verify_password(
        current_password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    await user_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "success": True,
        "message": "Password changed successfully.",
    }

async def get_department_managers(
    company_id: str,
    department_id: str,
):
    company_object_id = convert_object_id(
        company_id
    )

    department_object_id = convert_object_id(
        department_id
    )

    if not company_object_id or not department_object_id:
        return []

    managers = await user_collection.find(
        {
            "company_id": company_object_id,
            "department_id": department_object_id,
            "role": "manager",
            "is_active": True,
        },
        {
            "name": 1,
        },
    ).sort(
        "name", 1
    ).to_list(length=None)

    return [
        {
            "id": str(manager["_id"]),
            "name": manager["name"],
        }
        for manager in managers
    ]