from fastapi import APIRouter, Depends

from app.auth.security import get_current_user
from app.dashboard.schemas import DashboardSummary
from app.dashboard.service import get_dashboard_summary

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