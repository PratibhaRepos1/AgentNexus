from .base import NotificationProvider
from .console_provider import ConsoleNotificationProvider
from .resend_provider import ResendNotificationProvider
from ..core.config import settings
from ..models.lead import Lead


def get_notification_provider() -> NotificationProvider:
    if settings.resend_api_key:
        return ResendNotificationProvider()
    return ConsoleNotificationProvider()


async def notify_new_lead(business_name: str, contact_email: str, lead: Lead) -> None:
    provider = get_notification_provider()
    subject = f"New lead from {business_name}"
    html = f"""
        <p>You've got a new lead from your ChatBiz widget on <strong>{business_name}</strong>.</p>
        <ul>
            <li><strong>Name:</strong> {lead.name}</li>
            <li><strong>Email:</strong> {lead.email or "-"}</li>
            <li><strong>Phone:</strong> {lead.phone or "-"}</li>
            <li><strong>Message:</strong> {lead.message or "-"}</li>
        </ul>
        <p>Log in to your ChatBiz dashboard to follow up.</p>
    """
    await provider.send_email(to=contact_email, subject=subject, html=html)
