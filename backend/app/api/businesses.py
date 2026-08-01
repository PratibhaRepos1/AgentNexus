from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..models.user import User
from ..models.business import Business, BusinessSettings
from ..schemas.business import (
    BusinessOut,
    BusinessUpdate,
    BusinessSettingsOut,
    BusinessSettingsUpdate,
    PublicBusinessSettingsOut,
)
from fastapi import HTTPException

router = APIRouter(prefix="/api/businesses", tags=["businesses"])

DEFAULT_WELCOME_MESSAGE = "Hi! How can I help you today?"
DEFAULT_PRIMARY_COLOR = "#ff6b00"


@router.get("/{business_id}/public-settings", response_model=PublicBusinessSettingsOut)
def get_public_settings(business_id: str, db: Session = Depends(get_db)):
    # Public, widget-facing: only ever exposes display-safe fields (no contact
    # info, no LLM provider/model, nothing tenant-sensitive).
    s = db.query(BusinessSettings).filter(BusinessSettings.business_id == business_id).first()
    welcome_message = s.welcome_message if s and s.welcome_message else DEFAULT_WELCOME_MESSAGE
    business = db.query(Business).filter(Business.id == business_id).first()
    primary_color = business.primary_color if business and business.primary_color else DEFAULT_PRIMARY_COLOR
    return PublicBusinessSettingsOut(welcome_message=welcome_message, primary_color=primary_color)


@router.get("/me", response_model=BusinessOut)
def get_my_business(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.patch("/me", response_model=BusinessOut)
def update_my_business(
    update: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    for field, val in update.model_dump(exclude_none=True).items():
        setattr(business, field, val)
    db.commit()
    db.refresh(business)
    return business


@router.get("/me/settings", response_model=BusinessSettingsOut)
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(BusinessSettings).filter(BusinessSettings.business_id == current_user.business_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settings not found")
    return s


@router.patch("/me/settings", response_model=BusinessSettingsOut)
def update_settings(
    update: BusinessSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(BusinessSettings).filter(BusinessSettings.business_id == current_user.business_id).first()
    for field, val in update.model_dump(exclude_none=True).items():
        setattr(s, field, val)
    db.commit()
    db.refresh(s)
    return s
