from abc import ABC, abstractmethod
from typing import Dict, List, Optional

_TONE_STYLES = {
    "friendly": "warm and friendly",
    "formal": "formal and professional",
    "concise": "concise and to the point",
    "playful": "playful and upbeat",
}


def tone_instruction(tone: str) -> str:
    style = _TONE_STYLES.get(tone, _TONE_STYLES["friendly"])
    return f"Respond in a {style} tone."


_BASE_SYSTEM_PROMPT = (
    "You are a helpful business assistant. Answer questions using only the provided context. "
    "The context may be irrelevant to the current question -- if it does not actually answer what was asked, "
    "do not guess, estimate, or fill the gap with plausible-sounding general knowledge (e.g. never invent "
    "specific hours, prices, or policies that are not explicitly present in the context). In that case, say "
    "plainly that you don't have that information and offer to connect the user with the team. "
    "The conversation so far (if any) is included for context. A short follow-up question (e.g. \"and the "
    "cappuccino?\" after \"what's the price of a latte?\") is continuing the same aspect as the previous question "
    "-- price, availability, ingredients, etc. -- for the new subject, so lead your answer with that same aspect. "
    "Never mention or narrate this reasoning to the user (e.g. never say things like \"the aspect being "
    "continued is price\") -- just answer naturally, as a person would, straight away."
)


def system_prompt(tone: str) -> str:
    return f"{_BASE_SYSTEM_PROMPT} {tone_instruction(tone)}"


def format_history(history: Optional[List[Dict[str, str]]]) -> str:
    """Renders prior turns as plain text, for providers without a native
    multi-turn messages API (Groq's OpenAI-style API uses real message
    roles instead; see groq_provider.py)."""
    if not history:
        return ""
    lines = [
        f"{'Visitor' if turn.get('sender') == 'visitor' else 'Assistant'}: {turn['content']}"
        for turn in history
    ]
    return "Conversation so far:\n" + "\n".join(lines) + "\n\n"


class LLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context: str,
        tone: str = "friendly",
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        pass


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed(self, texts: List[str]) -> List[List[float]]:
        pass
