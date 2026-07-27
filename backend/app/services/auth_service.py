import re
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.business import Business, BusinessSettings
from ..models.user import User
from ..schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from ..core.security import hash_password, verify_password, create_access_token


def register(db: Session, req: RegisterRequest) -> TokenResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    slug = re.sub(r"[^a-z0-9-]", "-", req.business_slug.lower().strip())
    if db.query(Business).filter(Business.slug == slug).first():
        raise HTTPException(status_code=400, detail="Business slug already taken")

    business = Business(name=req.business_name, slug=slug, industry=req.industry)
    db.add(business)
    db.flush()

    biz_settings = BusinessSettings(business_id=business.id)
    db.add(biz_settings)

    user = User(
        business_id=business.id,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role="owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "business_id": str(business.id)})
    return TokenResponse(access_token=token)


def login(db: Session, req: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email, User.is_active == True).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "business_id": str(user.business_id)})
    return TokenResponse(access_token=token)
