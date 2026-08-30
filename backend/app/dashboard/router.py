from fastapi import APIRouter, Depends

from app.auth.security import get_current_user

from app.dashboard.schemas import (
    DashboardSummary,
    EmployeeAnalytics,
    DashboardData,
)

from app.dashboard.service import (
    get_dashboard_summary,
    get_employee_analytics,
    get_role_dashboard,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
async def dashboard_summary(
    current_user=Depends(get_current_user),
):
    return await get_dashboard_summary(
        str(current_user["company_id"])
    )


@router.get(
    "/employee-analytics",
    response_model=EmployeeAnalytics,
)
async def employee_analytics(
    current_user=Depends(get_current_user),
):
    return await get_employee_analytics(
        str(current_user["company_id"])
    )


@router.get(
    "/",
    response_model=DashboardData,
)
async def dashboard(
    current_user=Depends(get_current_user),
):
    return await get_role_dashboard(
        current_user
    )