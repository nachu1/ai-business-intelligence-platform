from fastapi import APIRouter, HTTPException, Depends, Query

from app.auth.authorization import require_roles
from app.auth.security import get_current_user

from app.schemas.user_schema import (
    UserCreate,
    UserUpdate,
    UserResponse,
    ChangePasswordSchema,
)

from app.services.company_service import get_company

from app.services.user_service import (
    create_new_user,
    get_user,
    get_company_users,
    get_company_user_stats,
    get_company_departments,
    update_user,
    delete_user,
    build_user_response,
    change_user_password,
    get_department_managers,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ---------------------------------------------------------
# CREATE USER
# ---------------------------------------------------------

@router.post("/", response_model=UserResponse)
async def add_user(
    user: UserCreate,
    current_user=Depends(
        require_roles(["admin"])
    )
):
    if user.company_id != str(
        current_user["company_id"]
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot create a user for another company."
        )

    created_user = await create_new_user(user)

    if not created_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid company, department, "
                "or designation."
            )
        )

    return created_user


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------

@router.get("/me")
async def current_user(
    user=Depends(get_current_user)
):
    company = await get_company(
        str(user["company_id"])
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    user_response = await build_user_response(
        user
    )

    user_response["company"] = {
        "id": company["id"],
        "name": company["name"],
    }

    return user_response


@router.put("/me/password")
async def change_password(
    data: ChangePasswordSchema,
    current_user=Depends(get_current_user),
):
    return await change_user_password(
        user_id=str(current_user["_id"]),
        current_password=data.current_password,
        new_password=data.new_password,
        confirm_password=data.confirm_password,
    )


# ---------------------------------------------------------
# COMPANY USER STATISTICS
# ---------------------------------------------------------

@router.get("/stats")
async def company_user_stats(
    current_user=Depends(
        require_roles(["admin", "manager"])
    )
):
    return await get_company_user_stats(
        company_id=str(
            current_user["company_id"]
        )
    )


# ---------------------------------------------------------
# COMPANY DEPARTMENTS
# ---------------------------------------------------------

@router.get("/departments")
async def company_departments(
    current_user=Depends(
        require_roles(["admin", "manager"])
    )
):
    departments = await get_company_departments(
        company_id=str(
            current_user["company_id"]
        )
    )

    return {
        "departments": departments
    }


@router.get("/managers")
async def department_managers(
    department_id: str,
    current_user=Depends(
        require_roles(["admin","manager"])
    )
):
    return await get_department_managers(
        company_id=str(
            current_user["company_id"]
        ),
        department_id=department_id,
    )

# ---------------------------------------------------------
# COMPANY USERS
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[UserResponse]
)
async def list_company_users(
    search: str | None = Query(
        default=None
    ),

    role: str | None = Query(
        default=None
    ),

    department: str | None = Query(
        default=None
    ),

    page: int = Query(
        default=1,
        ge=1
    ),

    limit: int = Query(
        default=10,
        ge=1
    ),

    current_user=Depends(
        require_roles(["admin", "manager"])
    )
):
    return await get_company_users(
        company_id=str(
            current_user["company_id"]
        ),
        search=search,
        role=role,
        department=department,
        page=page,
        limit=limit,
        current_user_role=current_user["role"],
    )


# ---------------------------------------------------------
# UPDATE USER
# ---------------------------------------------------------

@router.put(
    "/{user_id}",
    response_model=UserResponse
)
async def edit_user(
    user_id: str,
    user: UserUpdate,
    current_user=Depends(
        require_roles(["admin"])
    )
):
    existing_user = await get_user(
        user_id
    )

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if existing_user["company_id"] != str(
        current_user["company_id"]
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot modify a user from another company."
        )

    updated_user = await update_user(
        user_id,
        user
    )

    if not updated_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid department or designation."
            )
        )

    return updated_user


# ---------------------------------------------------------
# DELETE USER
# ---------------------------------------------------------

@router.delete("/{user_id}")
async def remove_user(
    user_id: str,
    current_user=Depends(
        require_roles(["admin"])
    )
):
    existing_user = await get_user(
        user_id
    )

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if existing_user["company_id"] != str(
        current_user["company_id"]
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot delete a user from another company."
        )

    deleted = await delete_user(
        user_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully"
    }


# ---------------------------------------------------------
# GET SINGLE USER
# ---------------------------------------------------------

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
async def fetch_user(
    user_id: str,
    current_user=Depends(
        require_roles(["admin", "manager"])
    )
):
    user = await get_user(
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user["company_id"] != str(
        current_user["company_id"]
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot access a user from another company."
        )

    return user