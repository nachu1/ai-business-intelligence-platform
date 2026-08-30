from fastapi import APIRouter, Depends

from app.auth.authorization import require_roles

from app.schemas.invite_schema import InviteUserSchema

from app.services.invite_service import (
    invite_user,
    get_company_invitations,
    resend_invitation,
    cancel_invitation,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ==================================================
# SEND INVITATION
# ==================================================

@router.post("/invite")
async def invite(
    data: InviteUserSchema,
    current_user=Depends(
        require_roles(["admin","manager"])
    ),
):
    return await invite_user(
        data,
        current_user,
    )


# ==================================================
# GET INVITATIONS
# ==================================================

@router.get("/invitations")
async def invitations(
    current_user=Depends(
        require_roles(["admin", "manager"])
    ),
):
    return await get_company_invitations(
        company_id=str(
            current_user["company_id"]
        ),
        current_user=current_user,
    )


# ==================================================
# RESEND INVITATION
# ==================================================

@router.post(
    "/invitations/{invitation_id}/resend"
)
async def resend(
    invitation_id: str,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    return await resend_invitation(
        invitation_id=invitation_id,
        company_id=str(
            current_user["company_id"]
        ),
    )


# ==================================================
# CANCEL INVITATION
# ==================================================

@router.delete(
    "/invitations/{invitation_id}"
)
async def cancel(
    invitation_id: str,
    current_user=Depends(
        require_roles(["admin"])
    ),
):
    return await cancel_invitation(
        invitation_id=invitation_id,
        company_id=str(
            current_user["company_id"]
        ),
    )