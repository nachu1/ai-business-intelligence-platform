from datetime import datetime

from bson import ObjectId

from app.database.mongodb import (
    notification_collection,
    user_collection,
)


async def create_notification(
    company_id: str,
    recipient_id: str,
    title: str,
    message: str,
    notification_type: str,
    action_url: str | None = None,
):
    notification = {
        "company_id": ObjectId(company_id),
        "recipient_id": ObjectId(recipient_id),
        "title": title,
        "message": message,
        "type": notification_type,
        "is_read": False,
        "created_at": datetime.utcnow(),
        "action_url": action_url,
    }

    result = await notification_collection.insert_one(
        notification
    )

    return str(result.inserted_id)


async def create_notifications(
    company_id: str,
    recipient_ids: list[str],
    title: str,
    message: str,
    notification_type: str,
    action_url: str | None = None,
):
    if not recipient_ids:
        return 0

    notifications = [
        {
            "company_id": ObjectId(company_id),
            "recipient_id": ObjectId(recipient_id),
            "title": title,
            "message": message,
            "type": notification_type,
            "is_read": False,
            "created_at": datetime.utcnow(),
            "action_url": action_url,
        }
        for recipient_id in recipient_ids
    ]

    result = await notification_collection.insert_many(
        notifications
    )

    return len(result.inserted_ids)


async def get_user_notifications(
    current_user: dict,
):
    notifications = (
        await notification_collection
        .find(
            {
                "company_id": ObjectId(
                    current_user["company_id"]
                ),
                "recipient_id": ObjectId(
                    current_user["_id"]
                ),
            }
        )
        .sort(
            "created_at",
            -1,
        )
        .to_list(length=50)
    )

    return [
        {
            "id": str(notification["_id"]),
            "title": notification["title"],
            "message": notification["message"],
            "type": notification["type"],
            "is_read": notification["is_read"],
            "created_at": notification["created_at"],
            "action_url": notification.get(
                "action_url"
            ),
        }
        for notification in notifications
    ]


async def get_unread_notification_count(
    current_user: dict,
):
    return await notification_collection.count_documents(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "recipient_id": ObjectId(
                current_user["_id"]
            ),
            "is_read": False,
        }
    )


async def mark_notification_as_read(
    notification_id: str,
    current_user: dict,
):
    result = await notification_collection.update_one(
        {
            "_id": ObjectId(notification_id),
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "recipient_id": ObjectId(
                current_user["_id"]
            ),
        },
        {
            "$set": {
                "is_read": True,
            }
        },
    )

    return result.modified_count > 0


async def mark_all_notifications_as_read(
    current_user: dict,
):
    result = await notification_collection.update_many(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "recipient_id": ObjectId(
                current_user["_id"]
            ),
            "is_read": False,
        },
        {
            "$set": {
                "is_read": True,
            }
        },
    )

    return result.modified_count


async def get_document_notification_recipients(
    uploader: dict,
):
    company_id = uploader["company_id"]
    uploader_id = uploader["_id"]
    role = uploader.get("role")
    department_id = uploader.get("department_id")

    recipient_ids = []

    if role == "employee":
        if department_id:
            manager = await user_collection.find_one(
                {
                    "company_id": company_id,
                    "department_id": department_id,
                    "role": "manager",
                    "is_active": True,
                },
                {
                    "_id": 1,
                },
            )

            if manager:
                recipient_ids.append(
                    str(manager["_id"])
                )

        admins = await user_collection.find(
            {
                "company_id": company_id,
                "role": "admin",
                "is_active": True,
                "_id": {
                    "$ne": uploader_id,
                },
            },
            {
                "_id": 1,
            },
        ).to_list(length=None)

        recipient_ids.extend(
            str(admin["_id"])
            for admin in admins
        )

    elif role == "manager":
        admins = await user_collection.find(
            {
                "company_id": company_id,
                "role": "admin",
                "is_active": True,
                "_id": {
                    "$ne": uploader_id,
                },
            },
            {
                "_id": 1,
            },
        ).to_list(length=None)

        recipient_ids.extend(
            str(admin["_id"])
            for admin in admins
        )

    return list(
        dict.fromkeys(recipient_ids)
    )