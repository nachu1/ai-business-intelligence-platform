from datetime import datetime
from bson import ObjectId


def create_designation(
    company_id: ObjectId,
    department_id: ObjectId,
    name: str,
):
    return {
        "company_id": company_id,
        "department_id": department_id,
        "name": name.strip(),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }