from app.database.mongodb import (
    user_collection,
    department_collection,
    designation_collection,
    document_collection,
)


async def get_company_context(current_user: dict) -> str:
    company_id = current_user["company_id"]
    role = current_user.get("role")
    department_id = current_user.get("department_id")

    users = []
    departments = []
    designations = []
    documents = []

    # =====================================================
    # ADMIN
    # =====================================================

    if role == "admin":
        users = await user_collection.find(
            {
                "company_id": company_id,
                "is_active": True,
            },
            {
                "name": 1,
                "role": 1,
                "department_name": 1,
                "designation_name": 1,
            },
        ).to_list(length=None)

        departments = await department_collection.find(
            {
                "company_id": company_id,
                "is_active": True,
            },
            {"name": 1},
        ).sort("name", 1).to_list(length=None)

        designations = await designation_collection.find(
            {
                "company_id": company_id,
                "is_active": True,
            },
            {
                "name": 1,
                "department_id": 1,
            },
        ).sort("name", 1).to_list(length=None)

        documents = await document_collection.find(
            {
                "company_id": company_id,
            },
            {
                "original_filename": 1,
                "document_type": 1,
                "uploaded_by": 1,
                "department_id": 1,
                "status": 1,
            },
        ).to_list(length=None)

    # =====================================================
    # MANAGER
    # =====================================================

    elif role == "manager":
        if not department_id:
            return ""

        users = await user_collection.find(
            {
                "company_id": company_id,
                "department_id": department_id,
                "is_active": True,
            },
            {
                "name": 1,
                "role": 1,
                "department_name": 1,
                "designation_name": 1,
            },
        ).to_list(length=None)

        departments = await department_collection.find(
            {
                "_id": department_id,
                "company_id": company_id,
                "is_active": True,
            },
            {"name": 1},
        ).to_list(length=None)

        designations = await designation_collection.find(
            {
                "company_id": company_id,
                "department_id": department_id,
                "is_active": True,
            },
            {"name": 1},
        ).sort("name", 1).to_list(length=None)

        documents = await document_collection.find(
            {
                "company_id": company_id,
                "department_id": department_id,
            },
            {
                "original_filename": 1,
                "document_type": 1,
                "uploaded_by": 1,
                "department_id": 1,
                "status": 1,
            },
        ).to_list(length=None)

    # =====================================================
    # EMPLOYEE
    # =====================================================

    elif role == "employee":
        users.append(
            {
                "name": current_user.get("name", ""),
                "role": "employee",
                "department_name": current_user.get(
                    "department_name", ""
                ),
                "designation_name": current_user.get(
                    "designation_name", ""
                ),
            }
        )

        if department_id:
            departments = await department_collection.find(
                {
                    "_id": department_id,
                    "company_id": company_id,
                    "is_active": True,
                },
                {"name": 1},
            ).to_list(length=None)

            managers = await user_collection.find(
                {
                    "company_id": company_id,
                    "department_id": department_id,
                    "role": "manager",
                    "is_active": True,
                },
                {
                    "name": 1,
                    "designation_name": 1,
                    "department_name": 1,
                },
            ).to_list(length=None)

            users.extend(
                {
                    "name": manager.get("name", ""),
                    "role": "manager",
                    "department_name": manager.get(
                        "department_name", ""
                    ),
                    "designation_name": manager.get(
                        "designation_name", ""
                    ),
                }
                for manager in managers
            )

        # Employee can only see their own uploaded documents.
        documents = await document_collection.find(
            {
                "company_id": company_id,
                "uploaded_by": current_user["_id"],
            },
            {
                "original_filename": 1,
                "document_type": 1,
                "uploaded_by": 1,
                "department_id": 1,
                "status": 1,
            },
        ).to_list(length=None)

    # =====================================================
    # SEPARATE USERS BY ROLE
    # =====================================================

    managers = [
        user
        for user in users
        if user.get("role") == "manager"
    ]

    employees = [
        user
        for user in users
        if user.get("role") == "employee"
    ]

    admins = [
        user
        for user in users
        if user.get("role") == "admin"
    ]

    # =====================================================
    # BUILD DOCUMENT INFORMATION
    # =====================================================

    document_lines = []

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

        uploader_name = (
            uploader.get("name", "Unknown")
            if uploader
            else "Unknown"
        )

        uploader_role = (
            uploader.get("role", "Unknown")
            if uploader
            else "Unknown"
        )

        department_name = (
            uploader.get("department_name", "Unknown")
            if uploader
            else "Unknown"
        )

        document_lines.append(
            {
                "name": document.get(
                    "original_filename",
                    "Unknown document",
                ),
                "type": document.get(
                    "document_type",
                    "Unknown",
                ),
                "uploader": uploader_name,
                "role": uploader_role,
                "department": department_name,
                "status": document.get(
                    "status",
                    "Unknown",
                ),
            }
        )

    # =====================================================
    # BUILD AI CONTEXT
    # =====================================================

    user_department = current_user.get(
        "department_name"
    )

    user_designation = current_user.get(
        "designation_name"
    )

    if role == "admin":
        department_context = (
            "The current user is a company administrator. "
            "They have company-wide responsibility and access. "
            "They do not normally belong to a specific department."
            if not user_department
            else user_department
        )

        designation_context = (
            "The current user is an administrator with "
            "company-wide responsibility. No department-specific "
            "designation is assigned."
            if not user_designation
            else user_designation
        )

    else:
        department_context = (
            user_department or "Unknown"
        )

        designation_context = (
            user_designation or "Unknown"
        )

    lines = [
        "AUTHORIZED COMPANY INFORMATION:",
        "",
        "CURRENT LOGGED-IN USER:",
        f"- Name: {current_user.get('name', 'Unknown')}",
        f"- Role: {current_user.get('role', 'Unknown')}",
        f"- Department: {department_context}",
        f"- Designation: {designation_context}",
        "",
        "CURRENT USER ROLE CONTEXT:",
    ]

    if role == "admin":
        lines.extend(
            [
                "- The current user is an administrator.",
                "- The administrator has company-wide access.",
                "- The administrator normally does not belong to a specific department.",
                "- If asked for their department and no department is assigned, explain that they are a company administrator with company-wide responsibility.",
                "- If asked for their designation and none is assigned, explain that they are an administrator with company-wide responsibility rather than saying the designation is unknown.",
            ]
        )

    elif role == "manager":
        lines.extend(
            [
                "- The current user is a manager.",
                "- The manager belongs to their assigned department.",
                "- The manager can access information authorized for their department.",
            ]
        )

    elif role == "employee":
        lines.extend(
            [
                "- The current user is an employee.",
                "- The employee belongs to their assigned department.",
                "- The employee can access their own uploaded documents.",
                "- The employee can access authorized information about their department and manager.",
            ]
        )

    lines.extend(
        [
            "",
            "IMPORTANT ACCESS RULES:",
            "- Use only the information provided below.",
            "- Managers are NOT employees for employee counts.",
            "- Employees are users whose role is exactly 'employee'.",
            "- Managers are users whose role is exactly 'manager'.",
            "- Administrators are users whose role is exactly 'admin'.",
            "- Do not claim that a document exists unless it appears in the DOCUMENTS section.",
            "- Do not reveal information outside the authorized user's access.",
            "",
            "IMPORTANT RESPONSE RULES:",
            "- If the user is authorized to access the requested information but it is not present in the available information, say that you could not find it in the available company information.",
            "- If the requested information is outside the user's authorized access, clearly explain that access is restricted.",
            "- Never say restricted information does not exist simply because it is not included in the authorized context.",
            "- Never reveal restricted information while explaining that access is restricted.",
            "- Do not invent missing information.",
            "- When a missing department or designation for an administrator has a known business meaning, explain that meaning instead of saying 'Unknown'.",
        ]
    )

    # =====================================================
    # ADMINISTRATORS
    # =====================================================

    if admins:
        lines.extend(["", "ADMINISTRATORS:"])

        for admin in admins:
            lines.append(
                f"- Name: {admin.get('name', 'Unknown')} | "
                f"Department: {admin.get('department_name', 'Unknown')} | "
                f"Designation: {admin.get('designation_name', 'Unknown')}"
            )

    # =====================================================
    # MANAGERS
    # =====================================================

    if managers:
        lines.extend(["", "MANAGERS:"])

        for manager in managers:
            lines.append(
                f"- Name: {manager.get('name', 'Unknown')} | "
                f"Department: {manager.get('department_name', 'Unknown')} | "
                f"Designation: {manager.get('designation_name', 'Unknown')}"
            )

    # =====================================================
    # EMPLOYEES
    # =====================================================

    if employees:
        lines.extend(["", "EMPLOYEES:"])

        for employee in employees:
            lines.append(
                f"- Name: {employee.get('name', 'Unknown')} | "
                f"Department: {employee.get('department_name', 'Unknown')} | "
                f"Designation: {employee.get('designation_name', 'Unknown')}"
            )

    lines.extend(
        [
            "",
            "EMPLOYEE COUNT:",
            f"- {len(employees)}",
        ]
    )

    # =====================================================
    # DEPARTMENTS
    # =====================================================

    if departments:
        lines.extend(["", "DEPARTMENTS:"])

        for department in departments:
            lines.append(
                f"- {department.get('name', 'Unknown')}"
            )

    # =====================================================
    # DESIGNATIONS
    # =====================================================

    if designations:
        lines.extend(["", "DESIGNATIONS:"])

        for designation in designations:
            lines.append(
                f"- {designation.get('name', 'Unknown')}"
            )

    # =====================================================
    # DOCUMENTS
    # =====================================================

    if document_lines:
        lines.extend(["", "DOCUMENTS:"])

        for document in document_lines:
            lines.append(
                f"- Document: {document['name']} | "
                f"Type: {document['type']} | "
                f"Uploaded by: {document['uploader']} | "
                f"Uploader role: {document['role']} | "
                f"Department: {document['department']} | "
                f"Status: {document['status']}"
            )
    else:
        lines.extend(
            [
                "",
                "DOCUMENTS:",
                "- No authorized documents found.",
            ]
        )

    return "\n".join(lines)