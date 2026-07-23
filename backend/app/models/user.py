from datetime import datetime


def create_user(
    company_id,
    name: str,
    email: str,
    password_hash: str,
    role: str,
):
    return {
        "company_id": company_id,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }