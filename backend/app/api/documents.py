from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_business
from ..models.user import User
from ..models.business import Business
from ..models.document import Document
from ..schemas.document import DocumentOut, DocumentFromUrlRequest
from ..services.document_service import ingest_document, ingest_url
from ..services import plan_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=List[DocumentOut])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.business_id == current_user.business_id).all()


@router.post("", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    plan_service.check_document_limit(db, business)
    return await ingest_document(db, str(current_user.business_id), str(current_user.id), file)


@router.post("/from-url", response_model=DocumentOut)
async def add_document_from_url(
    body: DocumentFromUrlRequest,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    plan_service.check_document_limit(db, business)
    return await ingest_url(db, str(current_user.business_id), str(current_user.id), body.url)


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(
        Document.id == doc_id, Document.business_id == current_user.business_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"ok": True}
