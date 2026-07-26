from fastapi import APIRouter, HTTPException, Depends

from app.auth.authorization import require_roles
from app.auth.security import get_current_user
from app.schemas.user_schema import UserCreate, UserResponse
from app.services.user_service import (
    create_new_user,
    get_user,
    get_company_users,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/", response_model=UserResponse)
async def add_user(
    user: UserCreate,
    current_user=Depends(require_roles(["admin"]))
):
    return await create_new_user(user)


@router.get("/me")
async def current_user(
    user=Depends(get_current_user)
):
    user["id"] = str(user["_id"])
    user["company_id"] = str(user["company_id"])

    del user["_id"]
    del user["password_hash"]

    return user


@router.get("/", response_model=list[UserResponse])
async def list_company_users(
    current_user=Depends(
        require_roles(["admin", "manager"])
    )
):
    return await get_company_users(
        str(current_user["company_id"])
    )


@router.get("/{user_id}", response_model=UserResponse)
async def fetch_user(user_id: str):
    user = await get_user(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user