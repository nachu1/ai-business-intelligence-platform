from bson import ObjectId
from bson.errors import InvalidId

from app.auth.passwords import hash_password
from app.database.mongodb import user_collection
from app.models.user import create_user
from app.schemas.user_schema import UserCreate


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