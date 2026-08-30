from fastapi import APIRouter, Response, Request, HTTPException

from app.schemas.auth_schema import (
    CompanyRegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
)

from app.services.auth_service import (
    register_company,
    login_user,
    forgot_password,
    reset_password,
)

from app.auth.security import (
    get_user_from_refresh_token,
    create_access_token,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

REFRESH_COOKIE = "refresh_token"


@router.post("/register")
async def register(
    data: CompanyRegisterSchema,
    response: Response,
):
    result = await register_company(data)

    if result.get("refresh_token"):
        response.set_cookie(
            key=REFRESH_COOKIE,
            value=result["refresh_token"],
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/auth",
        )

        result.pop("refresh_token", None)

    return result


@router.post("/login")
async def login(
    data: LoginSchema,
    response: Response,
):
    result = await login_user(data)

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=result["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/auth",
    )

    result.pop("refresh_token", None)

    return result


@router.post("/refresh")
async def refresh(
    request: Request,
):
    refresh_token = request.cookies.get(
        REFRESH_COOKIE
    )

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token missing.",
        )

    user = await get_user_from_refresh_token(
        refresh_token
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token.",
        )

    access_token = create_access_token(
        {
            "sub": user["email"],
        }
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    response: Response,
):
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path="/auth",
    )

    return {
        "success": True,
        "message": "Logged out successfully.",
    }


@router.post("/forgot-password")
async def forgot_password_route(
    data: ForgotPasswordSchema,
):
    return await forgot_password(data)


@router.post("/reset-password")
async def reset_password_route(
    data: ResetPasswordSchema,
):
    return await reset_password(data)