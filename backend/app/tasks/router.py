from fastapi import APIRouter, Depends, BackgroundTasks

from app.auth.security import get_current_user
from app.tasks.schemas import (
    CreateTaskRequest,
    SubmitTaskRequest,
)
from app.tasks.service import (
    create_task,
    get_employee_tasks,
    get_manager_tasks,
    submit_task,
    review_task,
)

from app.messages.websocket import manager

from app.database.mongodb import user_collection

from app.notifications.notification_service import (
    create_notifications,
)

from app.services.email_service import send_email


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


async def send_task_notifications(
    manager_user: dict,
    employee_id: str,
    task: dict,
):
    try:
        employee = await user_collection.find_one(
            {
                "_id": task.get(
                    "assigned_to"
                ),
                "company_id": task.get(
                    "company_id"
                ),
                "role": "employee",
                "is_active": True,
            }
        )

        if not employee:
            return

        if (
            manager_user.get("company_id")
            != employee.get("company_id")
            or manager_user.get("department_id")
            != employee.get("department_id")
        ):
            return

        manager_id = str(
            manager_user["_id"]
        )

        employee_id = str(
            employee["_id"]
        )

        task_title = task["title"]

        manager_name = manager_user.get(
            "name",
            "Your manager",
        )

        employee_name = employee.get(
            "name",
            "Employee",
        )

        company_id = str(
            manager_user["company_id"]
        )

        # ---------------------------------------------
        # EMPLOYEE NOTIFICATION
        # ---------------------------------------------

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

        # ---------------------------------------------
        # MANAGER NOTIFICATION
        # ---------------------------------------------

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

        # ---------------------------------------------
        # EMPLOYEE EMAIL
        # ---------------------------------------------

        try:
            await send_email(
                recipient=employee["email"],
                subject="New Task Assigned - BizInsight",
                body=f"""
                <html>
                <body>
                    <h2>New Task Assigned</h2>

                    <p>Hello {employee_name},</p>

                    <p>
                        <strong>{manager_name}</strong>
                        has assigned you a new task
                        on BizInsight.
                    </p>

                    <p>
                        <strong>Task:</strong>
                        {task_title}
                    </p>

                    <p>
                        Please sign in to BizInsight
                        to view the task details and
                        complete it.
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
                f"Task employee email failed: {error}"
            )

        # ---------------------------------------------
        # MANAGER EMAIL
        # ---------------------------------------------

        try:
            if manager_user.get("email"):
                await send_email(
                    recipient=manager_user["email"],
                    subject="Task Assigned - BizInsight",
                    body=f"""
                    <html>
                    <body>
                        <h2>Task Assigned</h2>

                        <p>Hello {manager_name},</p>

                        <p>
                            Your task has been successfully
                            assigned to
                            <strong>{employee_name}</strong>.
                        </p>

                        <p>
                            <strong>Task:</strong>
                            {task_title}
                        </p>

                        <p>
                            You can view the task from
                            your BizInsight dashboard.
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
                f"Task manager email failed: {error}"
            )

    except Exception as error:
        print(
            f"Task notification failed: {error}"
        )


# =========================================================
# CREATE TASK
# =========================================================

@router.post("")
async def create(
    request: CreateTaskRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    result = await create_task(
        sender_id=str(
            current_user["_id"]
        ),
        receiver_id=request.receiver_id,
        title=request.title,
        description=request.description,
        due_date=request.due_date,
    )

    # Existing WebSocket functionality
    await manager.send_to_user(
        request.receiver_id,
        {
            "type": "task_created",
            **result,
        },
    )

    # New notification + email functionality
    background_tasks.add_task(
        send_task_notifications,
        current_user,
        request.receiver_id,
        result,
    )

    return result


# =========================================================
# GET MY TASKS
# =========================================================

@router.get("/mine")
async def mine(
    current_user=Depends(get_current_user),
):
    if current_user["role"] == "employee":
        return await get_employee_tasks(
            str(current_user["_id"])
        )

    if current_user["role"] == "manager":
        return await get_manager_tasks(
            str(current_user["_id"])
        )

    return []


# =========================================================
# SUBMIT TASK
# =========================================================

@router.patch("/{task_id}/submit")
async def submit(
    task_id: str,
    document_id: str,
    current_user=Depends(get_current_user),
):
    result = await submit_task(
        task_id,
        str(current_user["_id"]),
        document_id,
    )

    await manager.send_to_user(
        result["assigned_by"],
        {
            "type": "task_submitted",
            **result,
        },
    )

    return result


# =========================================================
# REVIEW TASK
# =========================================================

@router.patch("/{task_id}/review")
async def review(
    task_id: str,
    status: str,
    rejection_reason: str | None = None,
    current_user=Depends(get_current_user),
):
    result = await review_task(
        task_id,
        str(current_user["_id"]),
        status,
        rejection_reason,
    )

    await manager.send_to_user(
        result["assigned_to"],
        {
            "type": "task_reviewed",
            **result,
        },
    )

    return result