from datetime import datetime
from bson import ObjectId


def create_invitation(
    company_id,
    name,
    email,
    department_id,
    designation_id,
    role,
    token,
):
    return {
        "company_id": ObjectId(company_id),
        "name": name,
        "email": email,

        "department_id": ObjectId(department_id),
        "designation_id": ObjectId(designation_id),

        "role": role,

        "token": token,

        "accepted": False,
        "cancelled": False,

        "created_at": datetime.utcnow(),
        "accepted_at": None,
        "cancelled_at": None,
    }