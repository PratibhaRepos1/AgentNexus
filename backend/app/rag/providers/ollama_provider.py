import httpx
from typing import Dict, List, Optional
from .base import LLMProvider, system_prompt, format_history
from ...core.config import settings


class OllamaProvider(LLMProvider):
    def __init__(self, model: str = "llama3"):
        self.model = model
        self.base_url = settings.ollama_base_url

    async def generate(
        self,
        prompt: str,
        context: str,
        tone: str = "friendly",
        history: Optional[List[Dict[str, str]]] = None,
        languages: Optional[List[str]] = None,
    ) -> str:
        full_prompt = (
            f"{system_prompt(tone, languages)}\n\n"
            f"{format_history(history)}"
            f"Context:\n{context}\n\nQuestion: {prompt}\nAnswer:"
        )
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": full_prompt, "stream": False},
            )
            return response.json().get("response", "")
