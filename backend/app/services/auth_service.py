from app.database.mongodb import db
from app.auth.security import hash_password
from app.models.company import create_company
from app.models.user import create_user
from app.schemas.auth_schema import CompanyRegisterSchema


def register_company(data: CompanyRegisterSchema):

    # Check if email already exists
    if db.users.find_one({"email": data.email}):
        return {
            "success": False,
            "message": "Email already exists."
        }

    # Check if company already exists
    if db.companies.find_one({"company_name": data.company_name}):
        return {
            "success": False,
            "message": "Company already exists."
        }

    # Hash password
    password_hash = hash_password(data.password)

    # Create company document
    company = create_company(data.company_name)

    # Insert company
    company_result = db.companies.insert_one(company)

    # Get generated company ID
    company_id = company_result.inserted_id

    # Create owner user
    owner = create_user(
        company_id=company_id,
        name=data.owner_name,
        email=data.email,
        password_hash=password_hash,
        role="OWNER"
    )

    # Insert owner
    db.users.insert_one(owner)

    return {
        "success": True,
        "message": "Company registered successfully."
    }