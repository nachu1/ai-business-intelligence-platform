from fastapi import APIRouter, BackgroundTasks

from app.schemas.activation_schema import (
    ActivateAccountSchema,
)

from app.services.activation_service import (
    get_invitation,
    activate_account,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/invitation/{token}")
async def invitation_details(token: str):
    return await get_invitation(token)


@router.post("/activate")
async def activate(
    data: ActivateAccountSchema,
    background_tasks: BackgroundTasks,
):
    return await activate_account(
        data,
        background_tasks,
    )