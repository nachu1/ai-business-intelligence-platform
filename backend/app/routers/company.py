from fastapi import APIRouter, HTTPException, Depends

from app.auth.authorization import require_roles

from app.schemas.company_schema import (
    CompanyCreate,
    CompanyResponse,
)

from app.schemas.department_schema import (
    DepartmentCreate,
    DepartmentResponse,
)

from app.schemas.designation_schema import (
    DesignationCreate,
    DesignationResponse,
)

from app.services.company_service import (
    create_company,
    get_company,
)

from app.services.department_service import (
    create_new_department,
    get_company_departments,
    deactivate_department,
)

from app.services.designation_service import (
    create_new_designation,
    get_department_designations,
    deactivate_designation,
)


router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


# ==================================================
# COMPANY
# ==================================================


@router.post(
    "/",
    response_model=CompanyResponse,
)
async def add_company(
    company: CompanyCreate,
):
    return await create_company(company)


# ==================================================
# DEPARTMENTS
# ==================================================


@router.post(
    "/departments",
    response_model=DepartmentResponse,
)
async def add_department(
    department: DepartmentCreate,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    company_id = current_user["company_id"]

    created_department = await create_new_department(
        company_id=company_id,
        name=department.name,
    )

    if not created_department:
        raise HTTPException(
            status_code=400,
            detail="A department with this name already exists.",
        )

    return created_department


@router.get(
    "/departments",
    response_model=list[DepartmentResponse],
)
async def list_departments(
    current_user=Depends(
        require_roles(
            ["admin", "manager", "employee"]
        )
    ),
):
    company_id = current_user["company_id"]

    return await get_company_departments(
        company_id=company_id
    )


@router.delete(
    "/departments/{department_id}",
)
async def delete_department(
    department_id: str,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    company_id = current_user["company_id"]

    deleted = await deactivate_department(
        department_id=department_id,
        company_id=company_id,
    )

    if deleted == "users_assigned":
     raise HTTPException(
        status_code=409,
        detail="This department cannot be deleted because users are assigned to it. Please reassign or remove those users first.",
    )

    if not deleted:
      raise HTTPException(
        status_code=404,
        detail="Department not found.",
    )

    return {
        "success": True,
        "message": "Department deleted successfully.",
    }


# ==================================================
# DESIGNATIONS
# ==================================================


@router.post(
    "/departments/{department_id}/designations",
    response_model=DesignationResponse,
)
async def add_designation(
    department_id: str,
    designation: DesignationCreate,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    company_id = current_user["company_id"]

    created_designation = await create_new_designation(
        company_id=company_id,
        department_id=department_id,
        name=designation.name,
    )

    if not created_designation:
        raise HTTPException(
            status_code=400,
            detail=(
                "Designation already exists "
                "or department was not found."
            ),
        )

    return created_designation


@router.get(
    "/departments/{department_id}/designations",
    response_model=list[DesignationResponse],
)
async def list_designations(
    department_id: str,
    current_user=Depends(
        require_roles(
            ["admin", "manager", "employee"]
        )
    ),
):
    company_id = current_user["company_id"]

    return await get_department_designations(
        company_id=company_id,
        department_id=department_id,
    )


@router.delete(
    "/designations/{designation_id}",
)
async def delete_designation(
    designation_id: str,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    company_id = current_user["company_id"]

    result = await deactivate_designation(
        designation_id=designation_id,
        company_id=company_id,
    )

    # --------------------------------------------------
    # USERS ARE ASSIGNED TO THIS DESIGNATION
    # --------------------------------------------------

    if result["reason"] == "users_assigned":
        raise HTTPException(
            status_code=400,
            detail=(
                "This designation cannot be deleted "
                "because users are assigned to it. "
                "Please reassign or remove those users first."
            ),
        )

    # --------------------------------------------------
    # DESIGNATION NOT FOUND
    # --------------------------------------------------

    if result["reason"] in [
        "not_found",
        "invalid_id",
    ]:
        raise HTTPException(
            status_code=404,
            detail="Designation not found.",
        )

    # --------------------------------------------------
    # SUCCESS
    # --------------------------------------------------

    return {
        "success": True,
        "message": "Designation deleted successfully.",
    }


# ==================================================
# GET COMPANY BY ID
# ==================================================

# IMPORTANT:
# Keep this route AFTER the specific department
# and designation routes above.


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
async def fetch_company(
    company_id: str,
):
    company = await get_company(
        company_id
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company