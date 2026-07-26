from bson import ObjectId
from bson.errors import InvalidId

from app.auth.passwords import hash_password
from app.database.mongodb import user_collection
from app.models.user import create_user
from app.schemas.user_schema import UserCreate
from app.schemas.user_schema import UserUpdate
from datetime import datetime

async def create_new_user(user: UserCreate):
    user_data = create_user(
        company_id=ObjectId(user.company_id),
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        department=user.department,
        designation=user.designation,
    )

    result = await user_collection.insert_one(user_data)

    user_data["id"] = str(result.inserted_id)
    user_data["company_id"] = str(user_data["company_id"])

    del user_data["password_hash"]

    return user_data


async def get_user(user_id: str):
    try:
        user = await user_collection.find_one(
            {"_id": ObjectId(user_id)}
        )
    except InvalidId:
        return None

    if not user:
        return None

    user["id"] = str(user["_id"])
    user["company_id"] = str(user["company_id"])

    del user["_id"]
    del user["password_hash"]

    return user


async def get_user_by_email(email: str):
    return await user_collection.find_one(
        {"email": email}
    )


async def get_company_users(
    company_id: str,
    search: str = None,
    role: str = None,
    department: str = None,
    page: int = 1,
    limit: int = 10,
):
    
    query = {
        "company_id": ObjectId(company_id)
    }

    if search:
        query["name"] = {
            "$regex": search,
            "$options": "i"
        }

    if role:
        query["role"] = role

    if department:
        query["department"] = department

    users = []

    skip = (page - 1) * limit

    cursor = (
       user_collection.find(query)
       .skip(skip)
       .limit(limit)
)

    async for user in cursor:
        user["id"] = str(user["_id"])
        user["company_id"] = str(user["company_id"])

        del user["_id"]
        del user["password_hash"]

        users.append(user)

    return users

async def update_user(user_id: str, user: UserUpdate):
    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "designation": user.designation,
                "is_active": user.is_active,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return await get_user(user_id)
async def delete_user(user_id: str):
    result = await user_collection.delete_one(
        {"_id": ObjectId(user_id)}
    )

    return result.deleted_count > 0