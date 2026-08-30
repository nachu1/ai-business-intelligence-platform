from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.notifications.notification_service import (
    create_notifications,
)
from app.services.email_service import send_email

from app.database.mongodb import (
    task_collection,
    user_collection,
    document_collection,
)


def oid(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


def utc_now():
    return datetime.now(timezone.utc)


def utc_iso(value):
    if not value:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat()


def task_response(task):
    return {
        "id": str(task["_id"]),
        "company_id": str(task["company_id"]),
        "assigned_by": str(task["assigned_by"]),
        "assigned_to": str(task["assigned_to"]),
        "title": task["title"],
        "description": task["description"],
        "due_date": utc_iso(task.get("due_date")),
        "status": task["status"],
        "document_id": (
            str(task["document_id"])
            if task.get("document_id")
            else None
        ),
        "created_at": utc_iso(task["created_at"]),
        "submitted_at": utc_iso(task.get("submitted_at")),
        "reviewed_at": utc_iso(task.get("reviewed_at")),
        "rejection_reason": task.get("rejection_reason"),
    }


async def create_task(
    sender_id: str,
    receiver_id: str,
    title: str,
    description: str,
    due_date=None,
):
    sender = await user_collection.find_one(
        {"_id": oid(sender_id)}
    )

    receiver = await user_collection.find_one(
        {"_id": oid(receiver_id)}
    )

    if not sender or not receiver:
        raise HTTPException(
            404,
            "User not found.",
        )

    if sender["role"] != "manager":
        raise HTTPException(
            403,
            "Only managers can create tasks.",
        )

    if receiver["role"] != "employee":
        raise HTTPException(
            403,
            "Tasks can only be assigned to employees.",
        )

    if (
        not sender.get("is_active")
        or not receiver.get("is_active")
    ):
        raise HTTPException(
            403,
            "Inactive users cannot use tasks.",
        )

    if sender["company_id"] != receiver["company_id"]:
        raise HTTPException(
            403,
            "You cannot assign tasks outside your organization.",
        )

    if (
        sender.get("department_id")
        != receiver.get("department_id")
    ):
        raise HTTPException(
            403,
            "You can only assign tasks to employees in your department.",
        )

    if due_date and due_date.tzinfo is None:
        due_date = due_date.replace(
            tzinfo=timezone.utc
        )

    task = {
        "company_id": sender["company_id"],
        "assigned_by": sender["_id"],
        "assigned_to": receiver["_id"],
        "title": title.strip(),
        "description": description.strip(),
        "due_date": due_date,
        "status": "pending",
        "document_id": None,
        "created_at": utc_now(),
        "submitted_at": None,
        "reviewed_at": None,
        "rejection_reason": None,
    }

    result = await task_collection.insert_one(task)

    task["_id"] = result.inserted_id

    # ==================================================
    # TASK NOTIFICATIONS
    # ==================================================

    company_id = str(sender["company_id"])
    manager_id = str(sender["_id"])
    employee_id = str(receiver["_id"])

    manager_name = sender.get(
        "name",
        "Your manager",
    )

    employee_name = receiver.get(
        "name",
        "Employee",
    )

    task_title = task["title"]

    # ==================================================
    # EMPLOYEE IN-APP NOTIFICATION
    # ==================================================

    try:
        await create_notifications(
            company_id=company_id,
            recipient_ids=[
                employee_id,
            ],
            title="New Task Assigned",
            message=(
                f'{manager_name} assigned you '
                f'the task "{task_title}".'
            ),
            notification_type="task",
            action_url="/dashboard",
        )

    except Exception as error:
        print(
            f"TASK EMPLOYEE NOTIFICATION ERROR: {error}"
        )

    # ==================================================
    # MANAGER IN-APP NOTIFICATION
    # ==================================================

    try:
        await create_notifications(
            company_id=company_id,
            recipient_ids=[
                manager_id,
            ],
            title="Task Assigned",
            message=(
                f'The task "{task_title}" was '
                f"assigned to {employee_name}."
            ),
            notification_type="task",
            action_url="/dashboard",
        )

    except Exception as error:
        print(
            f"TASK MANAGER NOTIFICATION ERROR: {error}"
        )

    # ==================================================
    # EMPLOYEE EMAIL
    # ==================================================

    if receiver.get("email"):
        try:
            await send_email(
                recipient=receiver["email"],
                subject="New Task Assigned - BizInsight",
                body=f"""
                <html>
                <body style="
                    font-family: Arial, sans-serif;
                    color: #334155;
                    line-height: 1.6;
                ">

                    <h2 style="color:#0f766e;">
                        New Task Assigned
                    </h2>

                    <p>
                        Hello {employee_name},
                    </p>

                    <p>
                        <strong>{manager_name}</strong>
                        has assigned you a new task
                        on BizInsight.
                    </p>

                    <div style="
                        margin:20px 0;
                        padding:16px;
                        background:#f0fdfa;
                        border-left:4px solid #0d9488;
                        border-radius:8px;
                    ">

                        <strong>Task:</strong>
                        {task_title}

                    </div>

                    <p>
                        Please sign in to BizInsight
                        to view and complete the task.
                    </p>

                    <p>
                        <a
                            href="http://172.20.10.4:5173/dashboard"
                            style="
                                display:inline-block;
                                padding:12px 22px;
                                background:#0d9488;
                                color:white;
                                text-decoration:none;
                                border-radius:8px;
                                font-weight:bold;
                            "
                        >
                            Open BizInsight
                        </a>
                    </p>

                    <p style="
                        margin-top:30px;
                        color:#64748b;
                    ">
                        Regards,<br>
                        BizInsight
                    </p>

                </body>
                </html>
                """,
            )

        except Exception as error:
            print(
                f"TASK EMPLOYEE EMAIL ERROR: {error}"
            )

    # ==================================================
    # MANAGER EMAIL
    # ==================================================

    if sender.get("email"):
        try:
            await send_email(
                recipient=sender["email"],
                subject="Task Assigned - BizInsight",
                body=f"""
                <html>
                <body style="
                    font-family: Arial, sans-serif;
                    color: #334155;
                    line-height: 1.6;
                ">

                    <h2 style="color:#0f766e;">
                        Task Assigned
                    </h2>

                    <p>
                        Hello {manager_name},
                    </p>

                    <p>
                        Your task has been successfully
                        assigned to
                        <strong>{employee_name}</strong>.
                    </p>

                    <div style="
                        margin:20px 0;
                        padding:16px;
                        background:#f0fdfa;
                        border-left:4px solid #0d9488;
                        border-radius:8px;
                    ">

                        <strong>Task:</strong>
                        {task_title}

                    </div>

                    <p>
                        You can view the task from
                        your BizInsight dashboard.
                    </p>

                    <p>
                        <a
                            href="http://172.20.10.4:5173/dashboard"
                            style="
                                display:inline-block;
                                padding:12px 22px;
                                background:#0d9488;
                                color:white;
                                text-decoration:none;
                                border-radius:8px;
                                font-weight:bold;
                            "
                        >
                            Open BizInsight
                        </a>
                    </p>

                    <p style="
                        margin-top:30px;
                        color:#64748b;
                    ">
                        Regards,<br>
                        BizInsight
                    </p>

                </body>
                </html>
                """,
            )

        except Exception as error:
            print(
                f"TASK MANAGER EMAIL ERROR: {error}"
            )

    return task_response(task)


async def get_employee_tasks(user_id: str):
    user = await user_collection.find_one(
        {"_id": oid(user_id)}
    )

    if not user:
        raise HTTPException(
            404,
            "User not found.",
        )

    tasks = (
        await task_collection.find(
            {
                "assigned_to": oid(user_id)
            }
        )
        .sort(
            "created_at",
            -1,
        )
        .to_list(length=None)
    )

    return [
        task_response(task)
        for task in tasks
    ]


async def get_manager_tasks(user_id: str):
    user = await user_collection.find_one(
        {"_id": oid(user_id)}
    )

    if not user:
        raise HTTPException(
            404,
            "User not found.",
        )

    tasks = (
        await task_collection.find(
            {
                "assigned_by": oid(user_id)
            }
        )
        .sort(
            "created_at",
            -1,
        )
        .to_list(length=None)
    )

    return [
        task_response(task)
        for task in tasks
    ]


async def submit_task(
    task_id: str,
    user_id: str,
    document_id: str,
):
    task = await task_collection.find_one(
        {
            "_id": oid(task_id),
            "assigned_to": oid(user_id),
        }
    )

    if not task:
        raise HTTPException(
            404,
            "Task not found.",
        )

    if task["status"] not in [
        "pending",
        "rejected",
    ]:
        raise HTTPException(
            400,
            "This task cannot be submitted.",
        )

    document = await document_collection.find_one(
        {
            "_id": oid(document_id),
            "uploaded_by": oid(user_id),
            "company_id": task["company_id"],
        }
    )

    if not document:
        raise HTTPException(
            403,
            "This document cannot be used for this task.",
        )

    now = utc_now()

    await task_collection.update_one(
        {"_id": task["_id"]},
        {
            "$set": {
                "status": "submitted",
                "document_id": document["_id"],
                "submitted_at": now,
                "reviewed_at": None,
                "rejection_reason": None,
            }
        },
    )

    task.update(
        {
            "status": "submitted",
            "document_id": document["_id"],
            "submitted_at": now,
            "reviewed_at": None,
            "rejection_reason": None,
        }
    )

    return task_response(task)


async def review_task(
    task_id: str,
    manager_id: str,
    status: str,
    rejection_reason: str | None = None,
):
    if status not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            400,
            "Invalid task status.",
        )

    task = await task_collection.find_one(
        {
            "_id": oid(task_id),
            "assigned_by": oid(manager_id),
        }
    )

    if not task:
        raise HTTPException(
            404,
            "Task not found.",
        )

    if task["status"] != "submitted":
        raise HTTPException(
            400,
            "Only submitted tasks can be reviewed.",
        )

    if status == "rejected" and not rejection_reason:
        raise HTTPException(
            400,
            "A rejection reason is required.",
        )

    reason = (
        rejection_reason.strip()
        if rejection_reason
        else None
    )

    now = utc_now()

    await task_collection.update_one(
        {"_id": task["_id"]},
        {
            "$set": {
                "status": status,
                "reviewed_at": now,
                "rejection_reason": reason,
            }
        },
    )

    task.update(
        {
            "status": status,
            "reviewed_at": now,
            "rejection_reason": reason,
        }
    )

    return task_response(task)