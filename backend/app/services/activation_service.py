from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from fastapi import BackgroundTasks

from app.database.mongodb import (
    invitation_collection,
    user_collection,
    department_collection,
    designation_collection,
)
from app.messages.websocket import manager
from app.auth.passwords import hash_password
from app.models.user import create_user
from app.schemas.activation_schema import ActivateAccountSchema

from app.notifications.notification_service import (
    create_notifications,
)
from app.services.email_service import send_email


async def get_invitation(token: str):

    invitation = await invitation_collection.find_one(
        {
            "token": token,
        }
    )

    if not invitation:
        return {
            "success": False,
            "status": "invalid",
            "message": "This invitation link is not valid.",
        }

    if invitation.get("cancelled", False):
        return {
            "success": False,
            "status": "cancelled",
            "message": (
                "This invitation has been cancelled. "
                "Please contact your administrator."
            ),
        }

    if invitation.get("accepted", False):
        return {
            "success": False,
            "status": "already_activated",
            "message": (
                "Your account has already been activated. "
                "Please sign in to continue."
            ),
        }

    invitation["id"] = str(invitation["_id"])
    invitation["company_id"] = str(
        invitation["company_id"]
    )
    invitation["department_id"] = str(
        invitation["department_id"]
    )
    invitation["designation_id"] = str(
        invitation["designation_id"]
    )

    del invitation["_id"]

    return {
        "success": True,
        "status": "pending",
        "invitation": invitation,
    }


async def send_user_joined_notifications(
    company_id: ObjectId,
    department_id: ObjectId,
    user_name: str,
):
    try:
        admins = await user_collection.find(
            {
                "company_id": company_id,
                "role": "admin",
                "is_active": True,
            },
            {
                "_id": 1,
                "email": 1,
                "name": 1,
            },
        ).to_list(length=None)

        department_manager = await user_collection.find_one(
            {
                "company_id": company_id,
                "department_id": department_id,
                "role": "manager",
                "is_active": True,
            },
            {
                "_id": 1,
                "email": 1,
                "name": 1,
            },
        )

        recipients = {}

        for admin in admins:
            recipients[str(admin["_id"])] = admin

        if department_manager:
            recipients[str(department_manager["_id"])] = department_manager

        recipient_ids = list(recipients.keys())

        if not recipient_ids:
            return

        await create_notifications(
            company_id=str(company_id),
            recipient_ids=recipient_ids,
            title="New User Joined",
            message=(
                f"{user_name} has joined the company."
            ),
            notification_type="user",
            action_url="/users",
        )
        await manager.send_to_users(
          recipient_ids,
          {
            "type": "invitation_accepted",
            "message": f"{user_name} has accepted the invitation.",
          },
        )

        subject = "New User Joined BizInsight"

        for recipient in recipients.values():
            try:
                await send_email(
                    recipient=recipient["email"],
                    subject=subject,
                    body=f"""
                    <html>
                    <body>
                        <h2>New User Joined BizInsight</h2>

                        <p>Hello {recipient.get("name", "there")},</p>

                        <p>
                            <strong>{user_name}</strong>
                            has successfully accepted the invitation
                            and joined your organization on BizInsight.
                        </p>

                        <p>
                            You can view the user from the
                            Users section of your organization.
                        </p>

                        <p>
                            Regards,<br>
                            BizInsight
                        </p>
                    </body>
                    </html>
                    """,
                )
            except Exception as error:
                print(
                    f"User joined email failed: {error}"
                )

    except Exception as error:
        print(
            f"User joined notification failed: {error}"
        )


async def activate_account(
    data: ActivateAccountSchema,
    background_tasks: BackgroundTasks,
):

    invitation = await invitation_collection.find_one(
        {
            "token": data.token,
            "accepted": False,
            "cancelled": False,
        }
    )

    if not invitation:
        return {
            "success": False,
            "message": "Invalid or expired invitation.",
        }

    if data.password != data.confirm_password:
        return {
            "success": False,
            "message": "Passwords do not match.",
        }

    email = invitation["email"].strip().lower()

    # --------------------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------------------

    existing_user = await user_collection.find_one(
        {
            "email": email,
            "company_id": invitation["company_id"],
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
    # CONVERT IDS
    # --------------------------------------------------

    try:
        department_id = ObjectId(
            invitation["department_id"]
        )

        designation_id = ObjectId(
            invitation["designation_id"]
        )

        company_id = ObjectId(
            invitation["company_id"]
        )

    except (InvalidId, TypeError):
        return {
            "success": False,
            "message": "Invalid invitation data.",
        }

    # --------------------------------------------------
    # GET DEPARTMENT
    # --------------------------------------------------

    department = await department_collection.find_one(
        {
            "_id": department_id,
            "company_id": company_id,
            "is_active": True,
        }
    )

    if not department:
        return {
            "success": False,
            "message": (
                "The assigned department is no longer "
                "available."
            ),
        }

    # --------------------------------------------------
    # GET DESIGNATION
    # --------------------------------------------------

    designation = await designation_collection.find_one(
        {
            "_id": designation_id,
            "company_id": company_id,
            "department_id": department_id,
            "is_active": True,
        }
    )

    if not designation:
        return {
            "success": False,
            "message": (
                "The assigned designation is no longer "
                "available."
            ),
        }

    # --------------------------------------------------
    # CREATE USER
    # --------------------------------------------------

    user = create_user(
        company_id=company_id,
        name=invitation["name"],
        email=email,
        password_hash=hash_password(
            data.password
        ),
        role=invitation["role"],
        department_id=department_id,
        department_name=department["name"],
        designation_id=designation_id,
        designation_name=designation["name"],
    )

    await user_collection.insert_one(user)

    # --------------------------------------------------
    # ACCEPT INVITATION
    # --------------------------------------------------

    await invitation_collection.update_one(
        {
            "_id": invitation["_id"],
        },
        {
            "$set": {
                "accepted": True,
                "accepted_at": datetime.utcnow(),
            },
        },
    )

    # --------------------------------------------------
    # USER JOINED NOTIFICATIONS
    # --------------------------------------------------

    background_tasks.add_task(
        send_user_joined_notifications,
        company_id,
        department_id,
        invitation["name"],
    )

    return {
        "success": True,
        "message": "Account activated successfully.",
    }