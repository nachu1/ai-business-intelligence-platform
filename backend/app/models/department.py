from datetime import datetime
from bson import ObjectId


def create_department(
    company_id: ObjectId,
    name: str,
):
    return {
        "company_id": company_id,
        "name": name.strip(),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }