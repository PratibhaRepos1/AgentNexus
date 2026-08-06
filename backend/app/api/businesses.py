from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_business
from ..models.user import User
from ..models.business import Business, BusinessSettings
from ..schemas.business import (
    BusinessOut,
    BusinessUpdate,
    BusinessSettingsOut,
    BusinessSettingsUpdate,
    PublicBusinessSettingsOut,
)
from ..schemas.plan import (
    PlanCatalogEntry,
    PlanStatusOut,
    PlanSelectRequest,
    ApiAccessAddonRequest,
    ApiKeyOut,
    NotificationChannelRequest,
)
from ..core.plans import PLANS
from ..services import plan_service
import secrets
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
    languages = (s.languages if s and s.languages else None) or ["en"]
    overrides = (s.welcome_messages if s and s.welcome_messages else None) or {}
    # Every enabled language gets an entry -- one with its own translation if the
    # business wrote one, otherwise the base welcome_message as a safe fallback
    # (still on-brand, just not translated) rather than omitting the language.
    welcome_messages = {lang: overrides.get(lang, welcome_message) for lang in languages}
    business = db.query(Business).filter(Business.id == business_id).first()
    primary_color = business.primary_color if business and business.primary_color else DEFAULT_PRIMARY_COLOR
    return PublicBusinessSettingsOut(
        welcome_message=welcome_message,
        welcome_messages=welcome_messages,
        languages=languages,
        primary_color=primary_color,
    )


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
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    updates = update.model_dump(exclude_none=True)
    # Custom branding (a non-default widget color) is a paid-plan feature --
    # Free stays on the default brand color.
    if "primary_color" in updates:
        wants_custom_color = updates["primary_color"].lower() != DEFAULT_PRIMARY_COLOR.lower()
        if wants_custom_color and not plan_service.resolve_features(business)["custom_branding"]:
            raise HTTPException(
                status_code=403,
                detail="Custom branding isn't available on your plan. Upgrade to set a custom widget color.",
            )
    for field, val in updates.items():
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
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    s = db.query(BusinessSettings).filter(BusinessSettings.business_id == current_user.business_id).first()
    updates = update.model_dump(exclude_none=True)
    if "languages" in updates:
        plan_service.check_language_limit(business, updates["languages"])
    for field, val in updates.items():
        setattr(s, field, val)
    db.commit()
    db.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------

@router.get("/plans", response_model=list[PlanCatalogEntry])
def list_plans():
    """Public plan catalog -- powers the pricing/upgrade UI, no auth needed."""
    return plan_service.get_plan_catalog()


@router.get("/me/plan", response_model=PlanStatusOut)
def get_my_plan(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    """Current plan + live usage + resolved feature flags for this business.
    This is what the dashboard reads to decide what to show/hide/lock."""
    return plan_service.get_plan_status(db, business)


@router.patch("/me/plan", response_model=PlanStatusOut)
def choose_plan(
    body: PlanSelectRequest,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """The business user picks a plan (Free/Basic/Business/Growth). No
    payment processing is wired up here -- in production this would sit
    behind a checkout/billing step; for now the plan takes effect
    immediately, same as the other "not ready yet" seams in this module."""
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan '{body.plan}'.")
    business.plan = body.plan
    if body.plan != "business":
        business.api_access_addon = False  # add-on is Business-tier only
    db.commit()
    db.refresh(business)
    return plan_service.get_plan_status(db, business)


@router.patch("/me/plan/api-access-addon", response_model=PlanStatusOut)
def set_api_access_addon(
    body: ApiAccessAddonRequest,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Toggle the Business-tier "+$12/mo API access" add-on. Growth doesn't
    need this (API access is already included); Free/Basic don't offer it."""
    if not plan_service.get_plan(business.plan).features.api_access_addon_available:
        raise HTTPException(
            status_code=403,
            detail="The API access add-on is only available on the Business plan.",
        )
    business.api_access_addon = body.enabled
    db.commit()
    db.refresh(business)
    return plan_service.get_plan_status(db, business)


# ---------------------------------------------------------------------------
# API access (gated feature -- Growth includes it, Business via add-on)
# ---------------------------------------------------------------------------

@router.get("/me/api-key", response_model=ApiKeyOut)
def get_api_key(business: Business = Depends(get_current_business)):
    return ApiKeyOut(api_key=business.api_key)


@router.post("/me/api-key", response_model=ApiKeyOut)
def create_api_key(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    plan_service.require_feature(business, "api_access")
    business.api_key = f"an_{secrets.token_urlsafe(32)}"
    db.commit()
    db.refresh(business)
    return ApiKeyOut(api_key=business.api_key)


@router.delete("/me/api-key", response_model=ApiKeyOut)
def revoke_api_key(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    business.api_key = None
    db.commit()
    return ApiKeyOut(api_key=None)


# ---------------------------------------------------------------------------
# Notification channels -- WhatsApp/Instagram are plan-gated but have no
# real provider integration yet (see NOT_YET_IMPLEMENTED_FEATURES). This
# endpoint exists so the frontend has something real to call: it correctly
# returns 403 (wrong plan) or 501 (right plan, not built yet) rather than
# silently succeeding and pretending messages are being sent.
# ---------------------------------------------------------------------------

@router.post("/me/notification-channels")
def set_notification_channel(
    body: NotificationChannelRequest,
    business: Business = Depends(get_current_business),
):
    feature_key = {
        "whatsapp": "whatsapp_notifications",
        "instagram": "instagram_integration",
    }.get(body.channel)
    if not feature_key:
        raise HTTPException(status_code=400, detail=f"Unknown channel '{body.channel}'.")
    plan_service.require_feature(business, feature_key)
    return {"ok": True}  # unreachable today -- require_feature always 501s these two
