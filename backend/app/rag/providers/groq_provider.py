from typing import Dict, List, Optional
from .base import LLMProvider, system_prompt
from ...core.config import settings


class GroqProvider(LLMProvider):
    def __init__(self, model: str = "llama-3.1-8b-instant"):
        self.model = model
        self._client = None

    def _get_client(self):
        if not self._client:
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=settings.groq_api_key)
        return self._client

    async def generate(
        self,
        prompt: str,
        context: str,
        tone: str = "friendly",
        history: Optional[List[Dict[str, str]]] = None,
        languages: Optional[List[str]] = None,
    ) -> str:
        client = self._get_client()
        system = system_prompt(tone, languages)
        user_message = f"Context:\n{context}\n\nQuestion: {prompt}"

        messages = [{"role": "system", "content": system}]
        for turn in history or []:
            role = "user" if turn.get("sender") == "visitor" else "assistant"
            messages.append({"role": role, "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=512,
        )
        return response.choices[0].message.content
