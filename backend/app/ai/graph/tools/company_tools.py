from bson import ObjectId

from app.database.mongodb import (
    user_collection,
    department_collection,
    designation_collection,
    document_collection,
)


async def get_my_profile(current_user: dict) -> dict:
    return {
        "name": current_user.get("name", "Unknown"),
        "role": current_user.get("role", "Unknown"),
        "department": current_user.get(
            "department_name"
        ),
        "designation": current_user.get(
            "designation_name"
        ),
    }


async def get_my_documents(
    current_user: dict,
) -> list[dict]:
    documents = await document_collection.find(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "uploaded_by": ObjectId(
                current_user["_id"]
            ),
        },
        {
            "original_filename": 1,
            "document_type": 1,
            "status": 1,
        },
    ).sort(
        "original_filename", 1
    ).to_list(length=None)

    return [
        {
            "name": document.get(
                "original_filename",
                "Unknown document",
            ),
            "type": document.get(
                "document_type",
                "Unknown",
            ),
            "status": document.get(
                "status",
                "Unknown",
            ),
        }
        for document in documents
    ]


async def get_available_documents(
    current_user: dict,
) -> dict:
    company_id = ObjectId(
        current_user["company_id"]
    )

    role = current_user.get("role")
    department_id = current_user.get(
        "department_id"
    )

    query = {
        "company_id": company_id,
    }

    if role == "manager":
        if not department_id:
            return {
                "documents": [],
                "admin_documents_accessible": False,
                "admin_document_count": 0,
            }

        query["department_id"] = ObjectId(
            department_id
        )

    elif role == "employee":
        query["uploaded_by"] = ObjectId(
            current_user["_id"]
        )

    elif role != "admin":
        return {
            "documents": [],
            "admin_documents_accessible": False,
            "admin_document_count": 0,
        }

    documents = await document_collection.find(
        query,
        {
            "original_filename": 1,
            "document_type": 1,
            "uploaded_by": 1,
            "department_id": 1,
            "status": 1,
        },
    ).sort(
        "original_filename", 1
    ).to_list(length=None)

    results = []

    for document in documents:
        uploader = None

        if document.get("uploaded_by"):
            uploader = await user_collection.find_one(
                {
                    "_id": document["uploaded_by"],
                    "company_id": company_id,
                },
                {
                    "name": 1,
                    "role": 1,
                    "department_name": 1,
                },
            )

        results.append(
            {
                "name": document.get(
                    "original_filename",
                    "Unknown document",
                ),
                "type": document.get(
                    "document_type",
                    "Unknown",
                ),
                "uploaded_by": (
                    uploader.get("name", "Unknown")
                    if uploader
                    else "Unknown"
                ),
                "uploader_role": (
                    uploader.get("role", "Unknown")
                    if uploader
                    else "Unknown"
                ),
                "department": (
                    uploader.get(
                        "department_name",
                        "Unknown",
                    )
                    if uploader
                    else "Unknown"
                ),
                "status": document.get(
                    "status",
                    "Unknown",
                ),
            }
        )

    admin_documents = [
        document
        for document in results
        if document.get("uploader_role") == "admin"
    ]

    return {
        "documents": results,
        "admin_documents_accessible": bool(
            admin_documents
        ),
        "admin_document_count": len(
            admin_documents
        ),
    }


       


async def get_my_manager(
    current_user: dict,
) -> dict | None:
    manager_id = current_user.get(
        "manager_id"
    )

    if not manager_id:
        return None

    manager = await user_collection.find_one(
        {
            "_id": ObjectId(manager_id),
            "company_id": ObjectId(
                current_user["company_id"]
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

    if not manager:
        return None

    return {
        "name": manager.get(
            "name",
            "Unknown",
        ),
        "department": manager.get(
            "department_name",
            "Unknown",
        ),
        "designation": manager.get(
            "designation_name",
            "Unknown",
        ),
    }


async def get_manager_employees(
    current_user: dict,
) -> list[dict]:
    manager_id = current_user.get("_id")

    if not manager_id:
        return []

    employees = await user_collection.find(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "manager_id": ObjectId(
                manager_id
            ),
            "role": "employee",
            "is_active": True,
        },
        {
            "name": 1,
            "department_name": 1,
            "designation_name": 1,
        },
    ).sort(
        "name", 1
    ).to_list(length=None)

    return [
        {
            "name": employee.get(
                "name",
                "Unknown",
            ),
            "department": employee.get(
                "department_name",
                "Unknown",
            ),
            "designation": employee.get(
                "designation_name",
                "Unknown",
            ),
        }
        for employee in employees
    ]
   


async def get_employee_count(
    current_user: dict,
) -> int:
    return await user_collection.count_documents(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "role": "employee",
            "is_active": True,
        }
    )


async def get_manager_count(
    current_user: dict,
) -> int:
    return await user_collection.count_documents(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "role": "manager",
            "is_active": True,
        }
    )


async def get_department_employees(
    current_user: dict,
) -> list[dict]:
    department_id = current_user.get(
        "department_id"
    )

    if not department_id:
        return []

    employees = await user_collection.find(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "department_id": ObjectId(
                department_id
            ),
            "role": "employee",
            "is_active": True,
        },
        {
            "name": 1,
            "department_name": 1,
            "designation_name": 1,
        },
    ).sort(
        "name", 1
    ).to_list(length=None)

    return [
        {
            "name": employee.get(
                "name",
                "Unknown",
            ),
            "department": employee.get(
                "department_name",
                "Unknown",
            ),
            "designation": employee.get(
                "designation_name",
                "Unknown",
            ),
        }
        for employee in employees
    ]

async def get_employee_by_name(
    current_user: dict,
    name: str,
) -> list[dict]:
    employees = await user_collection.find(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "name": {
                "$regex": f"^{name}$",
                "$options": "i",
            },
            "role": "employee",
            "is_active": True,
        },
        {
            "name": 1,
            "department_name": 1,
            "designation_name": 1,
        },
    ).to_list(length=None)

    return [
        {
            "name": employee.get(
                "name",
                "Unknown",
            ),
            "department": employee.get(
                "department_name",
                "Unknown",
            ),
            "designation": employee.get(
                "designation_name",
                "Unknown",
            ),
        }
        for employee in employees
    ]


async def get_department_count(
    current_user: dict,
) -> int:
    return await department_collection.count_documents(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "is_active": True,
        }
    )

async def get_user_by_name(
    current_user: dict,
    name: str,
) -> list[dict]:
    users = await user_collection.find(
        {
            "company_id": ObjectId(
                current_user["company_id"]
            ),
            "name": {
                "$regex": f"^{name}$",
                "$options": "i",
            },
            "is_active": True,
        },
        {
            "name": 1,
            "role": 1,
            "department_name": 1,
            "designation_name": 1,
        },
    ).sort(
        "name", 1
    ).to_list(length=None)

    return [
        {
            "name": user.get(
                "name",
                "Unknown",
            ),
            "role": user.get(
                "role",
                "Unknown",
            ),
            "department": user.get(
                "department_name",
                "Unknown",
            ),
            "designation": user.get(
                "designation_name",
                "Unknown",
            ),
        }
        for user in users
    ]


