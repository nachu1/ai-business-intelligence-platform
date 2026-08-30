from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_current_user
from bson import ObjectId

from app.database.mongodb import notification_collection

from app.notifications.notification_service import (
    get_user_notifications,
    get_unread_notification_count,
    mark_notification_as_read,
    mark_all_notifications_as_read,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get("/")
async def get_notifications(
    current_user: dict = Depends(
        get_current_user
    ),
):
    return await get_user_notifications(
        current_user
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(
        get_current_user
    ),
):
    count = await get_unread_notification_count(
        current_user
    )

    return {
        "count": count
    }



@router.patch("/read-all")
async def read_all_notifications(
    current_user: dict = Depends(
        get_current_user
    ),
):
    count = await mark_all_notifications_as_read(
        current_user
    )

    return {
        "message": "Notifications marked as read.",
        "count": count,
    }


@router.delete("/clear-all")
async def clear_all_notifications(
    current_user=Depends(get_current_user),
):
    result = await notification_collection.delete_many(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "recipient_id": ObjectId(
                current_user["_id"]
            ),
        }
    )

    return {
        "message": "Notifications cleared",
        "deleted_count": result.deleted_count,
    }


@router.patch("/{notification_id}/read")
async def read_notification(
    notification_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    try:
        success = await mark_notification_as_read(
            notification_id,
            current_user,
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid notification ID.",
        )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return {
        "message": "Notification marked as read."
    }


