from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.limiter import limiter
from ..notifications import notify_password_reset
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    TokenResponse,
)
from ..services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(db, req)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, req)


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/hour")
def forgot_password(
    request: Request,
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    result = auth_service.request_password_reset(db, req.email)
    if result:
        user, raw_token = result
        background_tasks.add_task(notify_password_reset, user.email, user.full_name, raw_token)
    # Always the same message whether or not the email is registered, so this
    # endpoint can't be used to enumerate accounts.
    return MessageResponse(message="If an account exists for that email, we've sent a password reset link.")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/hour")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, req.token, req.new_password)
    return MessageResponse(message="Your password has been reset. You can now sign in.")
