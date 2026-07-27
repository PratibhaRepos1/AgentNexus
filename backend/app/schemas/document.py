from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class DocumentFromUrlRequest(BaseModel):
    url: str


class DocumentOut(BaseModel):
    id: UUID
    business_id: UUID
    filename: str
    file_url: str
    file_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
