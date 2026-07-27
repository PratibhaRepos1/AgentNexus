from typing import Dict, List, Optional
from .base import LLMProvider, system_prompt, format_history
from ...core.config import settings


class GeminiProvider(LLMProvider):
    def __init__(self, model: str = "gemini-1.5-flash"):
        self.model = model
        self._initialized = False

    def _ensure_init(self):
        if not self._initialized:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(self.model)
            self._initialized = True

    async def generate(
        self,
        prompt: str,
        context: str,
        tone: str = "friendly",
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        self._ensure_init()
        import asyncio
        full_prompt = (
            f"{system_prompt(tone)}\n\n"
            f"{format_history(history)}"
            f"Context:\n{context}\n\nQuestion: {prompt}"
        )
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self._model.generate_content, full_prompt)
        return response.text
