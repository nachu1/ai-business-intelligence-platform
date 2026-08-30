from datetime import datetime


def create_user(
    company_id,
    name: str,
    email: str,
    password_hash: str,
    role: str,
    department_id,
    department_name: str,
    designation_id,
    designation_name: str,
    manager_id=None,
):
    now = datetime.utcnow()

    return {
        "company_id": company_id,

        "name": name,
        "email": email,
        "password_hash": password_hash,

        "role": role,

        "department_id": department_id,
        "department_name": department_name,

        "designation_id": designation_id,
        "designation_name": designation_name,

        "manager_id": manager_id,

        "is_active": True,

        "created_at": now,
        "updated_at": now,
    }