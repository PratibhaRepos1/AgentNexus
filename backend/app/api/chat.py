from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..core.limiter import limiter
from ..models.user import User
from ..schemas.chat import ChatMessageRequest, ChatMessageResponse, ConversationOut
from ..services.chat_service import handle_message
from ..models.conversation import Conversation
from ..models.lead import Lead

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse)
@limiter.limit("10/minute")
async def chat_message(request: Request, req: ChatMessageRequest, db: Session = Depends(get_db)):
    return await handle_message(db, req)


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .filter(Conversation.business_id == current_user.business_id)
        .order_by(Conversation.started_at.desc())
        .limit(50)
        .all()
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == current_user.business_id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Leads are the valuable record here -- unlink rather than cascade-delete
    # them just because the conversation that produced one is being removed.
    db.query(Lead).filter(Lead.conversation_id == conversation_id).update({"conversation_id": None})
    db.delete(conv)
    db.commit()
    return {"ok": True}


@router.get("/history/{session_id}", response_model=ConversationOut)
def get_history(session_id: str, business_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(
        Conversation.session_id == session_id,
        Conversation.business_id == business_id,
    ).first()
    return conv
