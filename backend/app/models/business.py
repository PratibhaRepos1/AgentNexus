import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False)
    industry = Column(Text, default="other")
    logo_url = Column(Text, nullable=True)
    primary_color = Column(Text, default="#ff6b00")
    plan = Column(Text, default="free")
    status = Column(Text, default="trial")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    users = relationship("User", back_populates="business")
    faqs = relationship("FAQ", back_populates="business")
    documents = relationship("Document", back_populates="business")
    products = relationship("Product", back_populates="business")
    conversations = relationship("Conversation", back_populates="business")
    leads = relationship("Lead", back_populates="business")
    settings = relationship("BusinessSettings", back_populates="business", uselist=False)


class BusinessSettings(Base):
    __tablename__ = "business_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, unique=True)
    tone = Column(Text, default="friendly")
    welcome_message = Column(Text, default="Hi! How can I help you today?")
    fallback_message = Column(
        Text, default="I'm not sure about that. Would you like to speak with our team?"
    )
    business_hours = Column(JSON, default=dict)
    contact_email = Column(Text, nullable=True)
    contact_phone = Column(Text, nullable=True)
    languages = Column(JSON, default=lambda: ["en"])
    llm_provider = Column(Text, default="groq")
    llm_model = Column(Text, nullable=True)

    business = relationship("Business", back_populates="settings", foreign_keys=[business_id],
                            primaryjoin="BusinessSettings.business_id == Business.id")
