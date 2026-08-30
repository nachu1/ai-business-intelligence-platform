from datetime import datetime
import re

from bson import ObjectId

from app.database.mongodb import (
    company_collection,
    user_collection,
    document_collection,
    department_collection,
    document_analysis_collection,
)


def object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


async def get_dashboard_summary(company_id: str):
    company_object_id = object_id(company_id)

    company = await company_collection.find_one(
        {"_id": company_object_id}
    )

    if not company:
        return {
            "company_name": "",
            "industry": "",
            "total_users": 0,
            "admins": 0,
            "managers": 0,
            "employees": 0,
            "departments": 0,
            "documents": 0,
            "documents_today": 0,
            "documents_processing": 0,
            "documents_failed": 0,
        }

    company_filter = {
        "company_id": company_object_id
    }

    total_users = await user_collection.count_documents(
        company_filter
    )

    admins = await user_collection.count_documents(
        {
            **company_filter,
            "role": "admin",
        }
    )

    managers = await user_collection.count_documents(
        {
            **company_filter,
            "role": "manager",
        }
    )

    employees = await user_collection.count_documents(
        {
            **company_filter,
            "role": "employee",
        }
    )

    departments = await department_collection.count_documents(
        {
            **company_filter,
            "is_active": True,
        }
    )

    documents = await document_collection.count_documents(
        company_filter
    )

    today = datetime.utcnow().replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    documents_today = await document_collection.count_documents(
        {
            **company_filter,
            "created_at": {
                "$gte": today
            },
        }
    )

    documents_processing = await document_collection.count_documents(
        {
            **company_filter,
            "status": "processing",
        }
    )

    documents_failed = await document_collection.count_documents(
        {
            **company_filter,
            "status": "failed",
        }
    )

    return {
        "company_name": company["name"],
        "industry": company["industry"],
        "total_users": total_users,
        "admins": admins,
        "managers": managers,
        "employees": employees,
        "departments": departments,
        "documents": documents,
        "documents_today": documents_today,
        "documents_processing": documents_processing,
        "documents_failed": documents_failed,
    }


async def get_employee_analytics(
    company_id: str,
    department_id: str | None = None,
):
    company_object_id = object_id(company_id)

    company_filter = {
        "company_id": company_object_id
    }

    if department_id:
        department_object_id = object_id(
            department_id
        )

        if not department_object_id:
            return {
                "total_users": 0,
                "active_users": 0,
                "inactive_users": 0,
                "role_distribution": {},
                "department_distribution": {},
            }

        company_filter[
            "department_id"
        ] = department_object_id

    total_users = await user_collection.count_documents(
        company_filter
    )

    active_users = await user_collection.count_documents(
        {
            **company_filter,
            "is_active": True,
        }
    )

    inactive_users = await user_collection.count_documents(
        {
            **company_filter,
            "is_active": False,
        }
    )

    role_pipeline = [
        {
            "$match": company_filter
        },
        {
            "$group": {
                "_id": "$role",
                "count": {
                    "$sum": 1
                },
            }
        },
    ]

    role_result = await user_collection.aggregate(
        role_pipeline
    ).to_list(None)

    role_distribution = {
        item["_id"]: item["count"]
        for item in role_result
        if item.get("_id")
    }

    department_pipeline = [
        {
            "$match": company_filter
        },
        {
            "$group": {
                "_id": "$department_name",
                "count": {
                    "$sum": 1
                },
            }
        },
    ]

    department_result = await user_collection.aggregate(
        department_pipeline
    ).to_list(None)

    department_distribution = {
        item["_id"]: item["count"]
        for item in department_result
        if item.get("_id")
    }

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "role_distribution": role_distribution,
        "department_distribution": department_distribution,
    }


async def get_dashboard_activities(
    company_id: str,
    department_id: str | None = None,
    uploaded_by: str | None = None,
):
    company_object_id = object_id(company_id)

    query = {
        "company_id": company_object_id
    }

    if department_id:
        department_object_id = object_id(
            department_id
        )

        if not department_object_id:
            return []

        query[
            "department_id"
        ] = department_object_id

    if uploaded_by:
        uploaded_by_object_id = object_id(
            uploaded_by
        )

        if not uploaded_by_object_id:
            return []

        query[
            "uploaded_by"
        ] = uploaded_by_object_id

    documents = await document_collection.find(
        query
    ).sort(
        "created_at",
        -1,
    ).limit(10).to_list(None)

    activities = []

    for document in documents:
        uploader_name = "Unknown user"

        if document.get("uploaded_by"):
            uploader = await user_collection.find_one(
                {
                    "_id": document[
                        "uploaded_by"
                    ]
                },
                {
                    "name": 1,
                },
            )

            if uploader:
                uploader_name = uploader.get(
                    "name",
                    "Unknown user",
                )

        department_name = "Unknown department"

        if document.get("department_id"):
            department = await department_collection.find_one(
                {
                    "_id": document[
                        "department_id"
                    ]
                },
                {
                    "name": 1,
                },
            )

            if department:
                department_name = department.get(
                    "name",
                    "Unknown department",
                )

        activities.append(
            {
                "document": document.get(
                    "original_filename",
                    "Unknown document",
                ),
                "uploaded_by": uploader_name,
                "department": department_name,
                "status": document.get(
                    "status",
                    "unknown",
                ),
                "created_at": document[
                    "created_at"
                ].isoformat(),
            }
        )

    return activities


async def get_dashboard_insights(
    company_id: str,
    limit: int = 5,
):
    analyses = await document_analysis_collection.find(
        {
            "company_id": company_id,
            "status": "completed",
            "insights": {
                "$exists": True,
                "$ne": [],
            },
        }
    ).sort(
        "_id",
        -1,
    ).limit(1).to_list(1)

    if not analyses:
        return []

    analysis = analyses[0]
    insights = []

    for insight in analysis.get("insights", []):
        if not isinstance(insight, dict):
            continue

        title = insight.get("title")
        description = insight.get("description")
        category = insight.get("category")

        if not title or not description:
            continue

        insights.append(
            {
                "title": title,
                "description": description,
                "category": category or "strategic",
                "document_id": analysis.get(
                    "document_id"
                ),
            }
        )

        if len(insights) >= limit:
            break

    return insights

       
    
       






async def get_role_dashboard(
    current_user: dict,
):
    company_id = str(
        current_user["company_id"]
    )

    role = current_user.get("role")

    # =====================================================
    # ADMIN
    # =====================================================

    if role == "admin":
        summary = await get_dashboard_summary(
            company_id
        )

        analytics = await get_employee_analytics(
            company_id
        )

        activities = await get_dashboard_activities(
            company_id
        )
        insights = await get_dashboard_insights(
            company_id
        )

        return {
            "role": "admin",
            "summary": summary,
            "employee_analytics": analytics,
            "activities": activities,
            "insights": insights,
            "manager": None,
            "department": None,
            "my_documents": 0,
        }

    # =====================================================
    # MANAGER
    # =====================================================

    if role == "manager":
        department_id = current_user.get(
            "department_id"
        )

        if not department_id:
            return {
                "role": "manager",
                "summary": None,
                "employee_analytics": None,
                "activities": [],
                "manager": None,
                "department": None,
                "my_documents": 0,
            }

        analytics = await get_employee_analytics(
            company_id,
            str(department_id),
        )

        activities = await get_dashboard_activities(
            company_id,
            str(department_id),
        )

        employee_count = await user_collection.count_documents(
            {
                "company_id": current_user[
                    "company_id"
                ],
                "department_id": department_id,
                "role": "employee",
                "is_active": True,
            }
        )

        document_count = await document_collection.count_documents(
            {
                "company_id": current_user[
                    "company_id"
                ],
                "department_id": department_id,
            }
        )

        today = datetime.utcnow().replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        documents_today = await document_collection.count_documents(
            {
                "company_id": current_user[
                    "company_id"
                ],
                "department_id": department_id,
                "created_at": {
                    "$gte": today
                },
            }
        )

        documents_processing = await document_collection.count_documents(
            {
                "company_id": current_user[
                    "company_id"
                ],
                "department_id": department_id,
                "status": "processing",
            }
        )

        documents_failed = await document_collection.count_documents(
            {
                "company_id": current_user[
                    "company_id"
                ],
                "department_id": department_id,
                "status": "failed",
            }
        )

        return {
            "role": "manager",
            "summary": {
                "company_name": "",
                "industry": "",
                "total_users": employee_count,
                "admins": 0,
                "managers": 1,
                "employees": employee_count,
                "departments": 1,
                "documents": document_count,
                "documents_today": documents_today,
                "documents_processing": documents_processing,
                "documents_failed": documents_failed,
            },
            "employee_analytics": analytics,
            "activities": activities,
            "manager": {
                "name": current_user.get(
                    "name",
                    "",
                ),
                "department": current_user.get(
                    "department_name",
                    "",
                ),
                "designation": current_user.get(
                    "designation_name",
                    "",
                ),
            },
            "department": {
                "name": current_user.get(
                    "department_name",
                    "",
                ),
            },
            "my_documents": 0,
        }

    # =====================================================
    # EMPLOYEE
    # =====================================================

    my_documents = await document_collection.count_documents(
        {
            "company_id": current_user[
                "company_id"
            ],
            "uploaded_by": current_user["_id"],
        }
    )

    department = {
        "name": current_user.get(
            "department_name",
            "",
        ),
    }

    manager = await user_collection.find_one(
        {
            "company_id": current_user[
                "company_id"
            ],
            "department_id": current_user.get(
                "department_id"
            ),
            "role": "manager",
            "is_active": True,
        },
        {
            "name": 1,
            "department_name": 1,
            "designation_name": 1,
        },
    )

    # Employee sees ONLY their own document activity.
    activities = await get_dashboard_activities(
        company_id,
        uploaded_by=str(
            current_user["_id"]
        ),
    )

    return {
        "role": "employee",
        "summary": None,
        "employee_analytics": None,
        "activities": activities,
        "manager": (
            {
                "name": manager.get(
                    "name",
                    "",
                ),
                "department": manager.get(
                    "department_name",
                    "",
                ),
                "designation": manager.get(
                    "designation_name",
                    "",
                ),
            }
            if manager
            else None
        ),
        "department": department,
        "my_documents": my_documents,
    }