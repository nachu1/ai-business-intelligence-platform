from datetime import datetime, timedelta, timezone

from bson import ObjectId

from app.database.mongodb import (
    document_collection,
    task_collection,
    user_collection,
)


def oid(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


def parse_date(value: str):
    return datetime.strptime(value, "%Y-%m-%d").replace(
        tzinfo=timezone.utc
    )


def date_range(start_date: str, end_date: str):
    start = parse_date(start_date)
    end = parse_date(end_date) + timedelta(days=1)
    return start, end


def percentage(value: int, total: int):
    return round((value / total) * 100, 1) if total else 0


async def get_report(
    current_user,
    start_date: str,
    end_date: str,
):
    start, end = date_range(start_date, end_date)

    company_id = current_user["company_id"]
    role = current_user.get("role")

    document_query = {
        "company_id": company_id,
        "created_at": {
            "$gte": start,
            "$lt": end,
        },
    }

    task_query = {
        "company_id": company_id,
        "created_at": {
            "$gte": start,
            "$lt": end,
        },
    }

    # -----------------------------------------------------
    # MANAGER
    # -----------------------------------------------------

    if role == "manager":
        department_id = current_user.get("department_id")

        if not department_id:
            document_query["_id"] = None
            task_query["_id"] = None
        else:
            document_query["department_id"] = department_id

            task_query["assigned_to"] = {
                "$in": await get_department_employee_ids(
                    company_id,
                    department_id,
                )
            }

    # -----------------------------------------------------
    # EMPLOYEE
    # -----------------------------------------------------

    elif role == "employee":
        user_id = current_user["_id"]

        document_query["uploaded_by"] = user_id
        task_query["assigned_to"] = user_id

    # -----------------------------------------------------
    # DOCUMENT STATUS
    # -----------------------------------------------------

    document_status_pipeline = [
        {"$match": document_query},
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
            }
        },
    ]

    document_status_result = await document_collection.aggregate(
        document_status_pipeline
    ).to_list(None)

    document_status = {
        "uploaded": 0,
        "processing": 0,
        "completed": 0,
        "failed": 0,
    }

    for item in document_status_result:
        status = item.get("_id")

        if status in document_status:
            document_status[status] = item["count"]

    # -----------------------------------------------------
    # TASK STATUS
    # -----------------------------------------------------

    task_status_pipeline = [
        {"$match": task_query},
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
            }
        },
    ]

    task_status_result = await task_collection.aggregate(
        task_status_pipeline
    ).to_list(None)

    task_status = {
        "pending": 0,
        "submitted": 0,
    }

    for item in task_status_result:
        status = item.get("_id")

        if status in task_status:
            task_status[status] = item["count"]

    # -----------------------------------------------------
    # TOTALS
    # -----------------------------------------------------

    total_documents = sum(document_status.values())
    total_tasks = sum(task_status.values())

    completion_rate = percentage(
        task_status["submitted"],
        total_tasks,
    )

    # -----------------------------------------------------
    # DOCUMENT ACTIVITY
    # -----------------------------------------------------

    document_activity_pipeline = [
        {"$match": document_query},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {
            "$sort": {
                "_id": 1,
            }
        },
    ]

    document_activity_result = await document_collection.aggregate(
        document_activity_pipeline
    ).to_list(None)

    document_activity = [
        {
            "date": item["_id"],
            "count": item["count"],
        }
        for item in document_activity_result
    ]

    # -----------------------------------------------------
    # TASK ACTIVITY
    # -----------------------------------------------------

    task_activity_pipeline = [
        {"$match": task_query},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {
            "$sort": {
                "_id": 1,
            }
        },
    ]

    task_activity_result = await task_collection.aggregate(
        task_activity_pipeline
    ).to_list(None)

    task_activity = [
        {
            "date": item["_id"],
            "count": item["count"],
        }
        for item in task_activity_result
    ]

    # -----------------------------------------------------
    # EMPLOYEE PERFORMANCE
    # -----------------------------------------------------

    employee_performance = []

    if role in ["admin", "manager"]:
        employee_query = {
            "company_id": company_id,
            "role": "employee",
        }

        if role == "manager":
            employee_query["department_id"] = current_user.get(
                "department_id"
            )

        employees = await user_collection.find(
            employee_query,
            {
                "_id": 1,
                "name": 1,
            },
        ).to_list(None)

        for employee in employees:
            employee_task_query = {
                **task_query,
                "assigned_to": employee["_id"],
            }

            assigned = await task_collection.count_documents(
                employee_task_query
            )

            submitted = await task_collection.count_documents(
                {
                    **employee_task_query,
                    "status": "submitted",
                }
            )

            pending = assigned - submitted

            employee_performance.append(
                {
                    "employee_id": str(employee["_id"]),
                    "employee_name": employee.get(
                        "name",
                        "Unknown",
                    ),
                    "assigned": assigned,
                    "submitted": submitted,
                    "pending": pending,
                    "completion_rate": percentage(
                        submitted,
                        assigned,
                    ),
                }
            )

        employee_performance.sort(
            key=lambda employee: employee["completion_rate"],
            reverse=True,
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_documents": total_documents,
            "completed_documents": document_status["completed"],
            "processing_documents": document_status["processing"],
            "failed_documents": document_status["failed"],
            "total_tasks": total_tasks,
            "pending_tasks": task_status["pending"],
            "submitted_tasks": task_status["submitted"],
            "completion_rate": completion_rate,
        },
        "document_activity": document_activity,
        "task_activity": task_activity,
        "task_status": task_status,
        "document_status": document_status,
        "employee_performance": employee_performance,
    }


async def get_department_employee_ids(
    company_id,
    department_id,
):
    employees = await user_collection.find(
        {
            "company_id": company_id,
            "department_id": department_id,
            "role": "employee",
        },
        {
            "_id": 1,
        },
    ).to_list(None)

    return [
        employee["_id"]
        for employee in employees
    ]