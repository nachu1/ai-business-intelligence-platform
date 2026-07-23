from datetime import datetime


def create_company(company_name: str):
    return {
        "company_name": company_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }