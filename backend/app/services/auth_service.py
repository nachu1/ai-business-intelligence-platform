import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.database.mongodb import (
    company_collection,
    user_collection,
    password_reset_collection,
)

from app.schemas.auth_schema import (
    CompanyRegisterSchema,
    ForgotPasswordSchema,
    LoginSchema,
    ResetPasswordSchema,
)

from app.schemas.company_schema import CompanyCreate
from app.schemas.user_schema import UserCreate

from app.services.company_service import create_company
from app.services.user_service import (
    create_new_user,
    get_user_by_email,
)

from app.auth.passwords import (
    hash_password,
    verify_password,
)

from app.auth.security import (
    create_access_token,
    create_refresh_token,
)
from app.services.email_service import send_email


async def register_company(data: CompanyRegisterSchema):

    existing_user = await get_user_by_email(data.email)

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists.",
        }

    existing_company = await company_collection.find_one(
        {"name": data.company_name}
    )

    if existing_company:
        return {
            "success": False,
            "message": "Company already exists.",
        }

    company = CompanyCreate(
        name=data.company_name,
        industry=data.industry,
        email=data.email,
        phone=data.phone,
        country=data.country,
        address=data.address,
    )

    company_result = await create_company(company)

    user = UserCreate(
        company_id=company_result["id"],
        name=data.owner_name,
        email=data.email,
        password=data.password,
        role="admin",
        department="Management",
        designation="System Administrator",
    )

    await create_new_user(user)

    access_token = create_access_token(
      {
         "sub": data.email,
      }
    )

    refresh_token = create_refresh_token(
      {
        "sub": data.email,
      }
    )

    return {
       "success": True,
       "message": "Company registered successfully.",
       "access_token": access_token,
       "refresh_token": refresh_token,
       "token_type": "bearer",
    }


async def login_user(data):

    print("LOGIN EMAIL:", data.email)

    user = await get_user_by_email(data.email)

    print("USER FOUND:", user is not None)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    print("USER ROLE:", user.get("role"))
    print("USER ACTIVE:", user.get("is_active"))

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive.",
        )

    password_valid = verify_password(
        data.password,
        user["password_hash"],
    )

    print("PASSWORD VALID:", password_valid)

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
      {
        "sub": user["email"],
      }
    )

    refresh_token = create_refresh_token(
      {
        "sub": user["email"],
      }
    )

    return {
      "success": True,
      "access_token": access_token,
      "refresh_token": refresh_token,
      "token_type": "bearer",
    }

async def forgot_password(
    data: ForgotPasswordSchema,
):
    user = await get_user_by_email(data.email)

    message = (
        "If an account exists with this email, "
        "a password reset link has been sent."
    )

    if not user:
        return {
            "success": True,
            "message": message,
        }

    token = secrets.token_urlsafe(48)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=30
    )

    await password_reset_collection.update_many(
        {
            "email": data.email,
            "used": False,
        },
        {
            "$set": {
                "used": True,
            }
        },
    )

    await password_reset_collection.insert_one(
        {
            "email": data.email,
            "token": token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc),
        }
    )

    reset_url = (
        "http://172.20.10.4:5173/reset-password"
        f"?token={token}"
    )

    await send_email(
        recipient=data.email,
        subject="Reset your BizInsight password",
        body=f"""
        <html>
        <body>
            <h2>Reset your BizInsight password</h2>

            <p>Hello {user.get("name", "there")},</p>

            <p>
                We received a request to reset your
                BizInsight account password.
            </p>

            <p>
                Click the button below to create a new password:
            </p>

            <p>
                <a
                    href="{reset_url}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#0d9488;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                    "
                >
                    Reset Password
                </a>
            </p>

            <p>
                This link will expire in 30 minutes.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>

            <p>
                Regards,<br>
                BizInsight
            </p>
        </body>
        </html>
        """,
    )

    return {
        "success": True,
        "message": message,
    }


async def reset_password(
    data: ResetPasswordSchema,
):
    if data.password != data.confirm_password:
        return {
            "success": False,
            "message": "Passwords do not match.",
        }

    reset_record = await password_reset_collection.find_one(
        {
            "token": data.token,
            "used": False,
        }
    )

    if not reset_record:
        return {
            "success": False,
            "message": "Invalid or already used reset link.",
        }

    expires_at = reset_record["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if expires_at < datetime.now(timezone.utc):
        return {
            "success": False,
            "message": "This password reset link has expired.",
        }

    user = await get_user_by_email(
        reset_record["email"]
    )

    if not user:
        return {
            "success": False,
            "message": "Unable to reset password.",
        }

    await user_collection.update_one(
        {
            "_id": user["_id"],
        },
        {
            "$set": {
                "password_hash": hash_password(
                    data.password
                ),
            }
        },
    )

    await password_reset_collection.update_one(
        {
            "_id": reset_record["_id"],
        },
        {
            "$set": {
                "used": True,
                "used_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "success": True,
        "message": "Password reset successfully.",
    }