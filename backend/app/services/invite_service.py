import secrets

from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from app.database.mongodb import (
    invitation_collection,
    user_collection,
    department_collection,
    designation_collection,
)

from app.models.invitation import create_invitation
from app.schemas.invite_schema import InviteUserSchema
from app.services.email_service import send_email


# =========================================================
# SEND INVITATION
# =========================================================

async def invite_user(
    data: InviteUserSchema,
    current_user,
):
    company_id = current_user["company_id"]
    if current_user["role"] == "manager":
     if str(current_user["department_id"]) != data.department_id:
        return {
            "success": False,
            "message": "Managers can only invite users to their own department.",
        }

     if data.role != "employee":
        return {
            "success": False,
            "message": "Managers can only invite employees.",
        }

    # --------------------------------------------------
    # VALIDATE DEPARTMENT
    # --------------------------------------------------

    try:
        department_object_id = ObjectId(
            data.department_id
        )
    except InvalidId:
        return {
            "success": False,
            "message": "Invalid department.",
        }

    # --------------------------------------------------
    # VALIDATE DESIGNATION
    # --------------------------------------------------

    try:
        designation_object_id = ObjectId(
            data.designation_id
        )
    except InvalidId:
        return {
            "success": False,
            "message": "Invalid designation.",
        }

    # --------------------------------------------------
    # CHECK DEPARTMENT
    # --------------------------------------------------

    department = await department_collection.find_one(
        {
            "_id": department_object_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return {
            "success": False,
            "message": "Department not found or inactive.",
        }

    # --------------------------------------------------
    # CHECK DESIGNATION
    # --------------------------------------------------

    designation = await designation_collection.find_one(
        {
            "_id": designation_object_id,
            "company_id": company_id,
            "department_id": department_object_id,
            "is_active": True,
        }
    )

    if not designation:
        return {
            "success": False,
            "message": (
                "Designation not found, inactive, "
                "or does not belong to this department."
            ),
        }

    # --------------------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------------------

    existing_user = await user_collection.find_one(
        {
            "email": data.email,
            "company_id": company_id,
        }
    )

    if existing_user:
        return {
            "success": False,
            "message": (
                "A user with this email already exists."
            ),
        }

    # --------------------------------------------------
    # CHECK EXISTING PENDING INVITATION
    # --------------------------------------------------

    existing_invitation = await invitation_collection.find_one(
        {
            "email": data.email,
            "company_id": company_id,
            "accepted": False,
            "cancelled": {
                "$ne": True
            },
        }
    )

    if existing_invitation:
        return {
            "success": False,
            "message": (
                "An invitation has already been sent "
                "to this email."
            ),
        }

    # --------------------------------------------------
    # GENERATE TOKEN
    # --------------------------------------------------

    token = secrets.token_urlsafe(32)

    # --------------------------------------------------
    # CREATE INVITATION
    # --------------------------------------------------

    invitation = create_invitation(
        company_id=str(company_id),
        name=data.name,
        email=data.email,
        department_id=str(department_object_id),
        designation_id=str(designation_object_id),
        role=data.role,
        token=token,
    )

    result = await invitation_collection.insert_one(
        invitation
    )

    # --------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------

    activation_url = (
        f"http://172.20.10.4:5173/"
        f"activate-account?token={token}"
    )

    await send_email(
        recipient=data.email,
        subject="You're invited to BizInsight",
        body=f"""
        <html>
        <body>
            <h2>You're invited to BizInsight</h2>

            <p>Hello {data.name},</p>

            <p>
                You have been invited to join your
                organization on BizInsight.
            </p>

            <p>
                Click the button below to activate
                your account:
            </p>

            <p>
                <a
                    href="{activation_url}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#0d9488;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Activate Account
                </a>
            </p>

            <p>
                If you did not expect this invitation,
                you can ignore this email.
            </p>

            <p>
                Regards,<br>
                BizInsight
            </p>
        </body>
        </html>
        """,
    )

    return {
        "success": True,
        "message": "Invitation sent successfully.",
    }


# =========================================================
# GET COMPANY INVITATIONS
# =========================================================

async def get_company_invitations(
    company_id: str,
    current_user,
):
    try:
        company_object_id = ObjectId(company_id)
        query = {
            "company_id": company_object_id,
        }

        if current_user["role"] == "manager":
          query["department_id"] = ObjectId(
            current_user["department_id"]
          )
    except InvalidId:
        return []

    cursor = invitation_collection.find(
       query
    ).sort(
      "created_at",
      -1,
    )

    invitations = []

    async for invitation in cursor:

        accepted = invitation.get(
            "accepted",
            False,
        )

        cancelled = invitation.get(
            "cancelled",
            False,
        )

        if accepted:
            status = "accepted"
        elif cancelled:
            status = "cancelled"
        else:
            status = "pending"

        invitations.append(
            {
                "id": str(
                    invitation["_id"]
                ),
                "name": invitation["name"],
                "email": invitation["email"],
                "role": invitation["role"],
                "department_id": str(
                    invitation["department_id"]
                ),
                "designation_id": str(
                    invitation["designation_id"]
                ),
                "status": status,
                "created_at": invitation[
                    "created_at"
                ],
                "accepted_at": invitation.get(
                    "accepted_at"
                ),
                "cancelled_at": invitation.get(
                    "cancelled_at"
                ),
            }
        )

    return invitations


# =========================================================
# RESEND INVITATION
# =========================================================

async def resend_invitation(
    invitation_id: str,
    company_id: str,
):
    try:
        invitation_object_id = ObjectId(
            invitation_id
        )

        company_object_id = ObjectId(
            company_id
        )

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid invitation.",
        }

    invitation = await invitation_collection.find_one(
        {
            "_id": invitation_object_id,
            "company_id": company_object_id,
        }
    )

    if not invitation:
        return {
            "success": False,
            "message": "Invitation not found.",
        }

    if invitation.get("accepted", False):
        return {
            "success": False,
            "message": (
                "This invitation has already "
                "been accepted."
            ),
        }

    if invitation.get("cancelled", False):
        return {
            "success": False,
            "message": (
                "This invitation has been cancelled."
            ),
        }

    # --------------------------------------------------
    # NEW TOKEN
    # --------------------------------------------------

    token = secrets.token_urlsafe(32)

    activation_url = (
        f"http://172.20.10.4:5173/"
        f"activate-account?token={token}"
    )

    # --------------------------------------------------
    # UPDATE TOKEN
    # --------------------------------------------------

    await invitation_collection.update_one(
        {
            "_id": invitation_object_id,
        },
        {
            "$set": {
                "token": token,
                "created_at": datetime.utcnow(),
            }
        },
    )

    # --------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------

    await send_email(
        recipient=invitation["email"],
        subject="Your BizInsight invitation",
        body=f"""
        <html>
        <body>
            <h2>Your BizInsight invitation</h2>

            <p>Hello {invitation["name"]},</p>

            <p>
                Here is your new invitation link
                to activate your BizInsight account.
            </p>

            <p>
                <a
                    href="{activation_url}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#0d9488;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Activate Account
                </a>
            </p>

            <p>
                Regards,<br>
                BizInsight
            </p>
        </body>
        </html>
        """,
    )

    return {
        "success": True,
        "message": "Invitation resent successfully.",
    }


# =========================================================
# CANCEL INVITATION
# =========================================================

async def cancel_invitation(
    invitation_id: str,
    company_id: str,
):
    try:
        invitation_object_id = ObjectId(
            invitation_id
        )

        company_object_id = ObjectId(
            company_id
        )

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid invitation.",
        }

    invitation = await invitation_collection.find_one(
        {
            "_id": invitation_object_id,
            "company_id": company_object_id,
        }
    )

    if not invitation:
        return {
            "success": False,
            "message": "Invitation not found.",
        }

    if invitation.get("accepted", False):
        return {
            "success": False,
            "message": (
                "An accepted invitation cannot "
                "be cancelled."
            ),
        }

    if invitation.get("cancelled", False):
        return {
            "success": False,
            "message": "Invitation is already cancelled.",
        }

    await invitation_collection.update_one(
        {
            "_id": invitation_object_id,
        },
        {
            "$set": {
                "cancelled": True,
                "cancelled_at": datetime.utcnow(),
            }
        },
    )

    return {
        "success": True,
        "message": "Invitation cancelled successfully.",
    }