from sqlalchemy.orm import Session
from ..models.conversation import Conversation, Message
from ..models.business import Business, BusinessSettings
from ..schemas.chat import ChatMessageRequest, ChatMessageResponse
from ..rag.pipeline import run_rag
from ..services import plan_service
from fastapi import HTTPException

HISTORY_LIMIT = 6


async def handle_message(db: Session, req: ChatMessageRequest) -> ChatMessageResponse:
    business = db.query(Business).filter(
        Business.id == req.business_id, Business.status.in_(["active", "trial"])
    ).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    biz_settings = db.query(BusinessSettings).filter(
        BusinessSettings.business_id == req.business_id
    ).first()

    conversation = db.query(Conversation).filter(
        Conversation.business_id == req.business_id,
        Conversation.session_id == req.session_id,
        Conversation.status == "open",
    ).first()

    if not conversation:
        # Only a brand-new conversation counts against the monthly cap --
        # a session that's already underway is never cut off mid-thread.
        plan_service.check_conversation_limit(db, business)
        conversation = Conversation(
            business_id=req.business_id,
            session_id=req.session_id,
            visitor_id=req.visitor_id,
        )
        db.add(conversation)
        db.flush()

    # Fetched before adding the current message below, so it naturally
    # excludes this turn and only contains prior conversation context.
    history_rows = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )
    history_rows.reverse()
    history = [{"sender": m.sender, "content": m.content} for m in history_rows]

    visitor_msg = Message(
        conversation_id=conversation.id,
        sender="visitor",
        content=req.message,
    )
    db.add(visitor_msg)

    provider = biz_settings.llm_provider if biz_settings else "groq"
    model = biz_settings.llm_model if biz_settings else None
    fallback_message = biz_settings.fallback_message if biz_settings else None
    fallback_messages = (biz_settings.fallback_messages if biz_settings else None) or {}
    tone = biz_settings.tone if biz_settings else "friendly"
    languages = (biz_settings.languages if biz_settings else None) or ["en"]

    # When the widget tells us the visitor's language, that's more reliable than
    # asking the LLM to detect it from the message -- pass it as the ONLY
    # enabled language so language_instruction() gives a deterministic "always
    # respond in X" instruction instead of a "detect and match" one. Also picks
    # the right translation for the no-context-found fallback below, which
    # never reaches the LLM at all.
    if req.lang and req.lang in languages:
        effective_languages = [req.lang]
        resolved_fallback = fallback_messages.get(req.lang) or fallback_message
    else:
        effective_languages = languages
        resolved_fallback = fallback_message

    reply, intent, confidence = await run_rag(
        db=db,
        business_id=str(req.business_id),
        message=req.message,
        llm_provider=provider,
        llm_model=model,
        fallback_message=resolved_fallback,
        tone=tone,
        history=history,
        languages=effective_languages,
    )

    ai_msg = Message(
        conversation_id=conversation.id,
        sender="ai",
        content=reply,
        intent=intent,
        confidence=confidence,
    )
    db.add(ai_msg)
    db.commit()

    suggest_lead = intent == "lead" or confidence < 0.3

    return ChatMessageResponse(
        reply=reply,
        intent=intent,
        confidence=confidence,
        session_id=req.session_id,
        suggest_lead_capture=suggest_lead,
    )
