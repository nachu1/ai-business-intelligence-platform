from fastapi import APIRouter, Depends, Query

from app.auth.security import get_current_user
from app.reports.service import get_report


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("")
async def report(
    start_date: str = Query(
        ...,
        description="Start date in YYYY-MM-DD format",
    ),
    end_date: str = Query(
        ...,
        description="End date in YYYY-MM-DD format",
    ),
    current_user=Depends(get_current_user),
):
    return await get_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )