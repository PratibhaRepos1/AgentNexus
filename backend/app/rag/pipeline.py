import json
import math
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session
from ..models.document import DocumentChunk
from ..models.faq import FAQ
from ..models.product import Product
from .embeddings import embed_query
from .providers import get_llm_provider


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve_chunks(
    db: Session, business_id: str, query_embedding: List[float], top_k: int = 4
) -> List[Tuple[str, float]]:
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.business_id == business_id, DocumentChunk.embedding_json.isnot(None))
        .all()
    )
    scored = []
    for chunk in chunks:
        emb = json.loads(chunk.embedding_json)
        score = _cosine_similarity(query_embedding, emb)
        scored.append((chunk.content, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def retrieve_faqs(db: Session, business_id: str, query: str) -> List[str]:
    faqs = (
        db.query(FAQ)
        .filter(FAQ.business_id == business_id, FAQ.is_active == True)
        .all()
    )
    query_lower = query.lower()
    matched = []
    for faq in faqs:
        if any(word in faq.question.lower() for word in query_lower.split() if len(word) > 3):
            matched.append(f"Q: {faq.question}\nA: {faq.answer}")
    return matched[:3]


def retrieve_products(db: Session, business_id: str, query: str) -> List[str]:
    products = (
        db.query(Product)
        .filter(Product.business_id == business_id, Product.is_active == True)
        .all()
    )
    query_words = [w for w in query.lower().split() if len(w) > 3]
    matched = []
    for product in products:
        haystack = f"{product.name} {product.category or ''} {product.description or ''}".lower()
        if any(word in haystack for word in query_words):
            price = f"{product.price} {product.currency}" if product.price is not None else "price not listed"
            line = f"Product: {product.name} — {price}"
            if product.description:
                line += f"\n{product.description}"
            matched.append(line)
    return matched[:5]


def _build_contextual_query(history: List[Dict[str, str]], message: str) -> str:
    # A bare follow-up like "and the cappuccino?" has no anchor to what was
    # actually being asked (price? ingredients?), so retrieval on it alone
    # tends to score too low to match anything. Prepending the prior visitor
    # turn gives embedding/keyword matching that missing anchor back.
    prior_visitor_messages = [h["content"] for h in history if h.get("sender") == "visitor"]
    if prior_visitor_messages:
        return f"{prior_visitor_messages[-1]} {message}"
    return message


async def run_rag(
    db: Session,
    business_id: str,
    message: str,
    llm_provider: str = "groq",
    llm_model: Optional[str] = None,
    top_k: int = 4,
    confidence_threshold: float = 0.25,
    fallback_message: Optional[str] = None,
    tone: str = "friendly",
    history: Optional[List[Dict[str, str]]] = None,
    languages: Optional[List[str]] = None,
) -> Tuple[str, str, float]:
    history = history or []
    search_query = _build_contextual_query(history, message)

    query_emb = embed_query(search_query)
    chunks = retrieve_chunks(db, business_id, query_emb, top_k)
    # Keyword matching (unlike embeddings) has no similarity threshold to
    # filter out noise, so it uses the raw current message only -- the
    # history-augmented search_query caused it to match on a *prior* turn's
    # keywords and pull in context irrelevant to the current question.
    faq_matches = retrieve_faqs(db, business_id, message)
    product_matches = retrieve_products(db, business_id, message)

    best_score = chunks[0][1] if chunks else 0.0
    intent = _detect_intent(message)

    context_parts = [c for c, s in chunks if s >= confidence_threshold]
    context_parts.extend(faq_matches)
    context_parts.extend(product_matches)
    context = "\n\n".join(context_parts)

    if not context.strip():
        default_fallback = "I don't have specific information about that right now. Would you like me to connect you with our team?"
        return (fallback_message or default_fallback, intent, 0.0)

    provider = get_llm_provider(llm_provider, llm_model)
    reply = await provider.generate(message, context, tone, history, languages)
    return reply, intent, best_score


def _detect_intent(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["price", "cost", "how much", "fee", "rate"]):
        return "product_inquiry"
    if any(w in msg for w in ["contact", "call", "email", "reach", "phone"]):
        return "lead"
    if any(w in msg for w in ["problem", "issue", "broken", "not working", "help"]):
        return "support"
    return "faq"
