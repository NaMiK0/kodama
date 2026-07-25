from functools import lru_cache
from typing import Protocol

from openai import OpenAI

from app.core.config import settings

class LLMProvider(Protocol):
    """Абстракция LLM-провайдера: «дай текст по промпту».
    Реализации: OpenRouter (сейчас), локальная LLM (позже)."""

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        ...


class OpenRouterProvider:
    def __init__(self) -> None:
        self._client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )
        self._model = settings.llm_model

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""

@lru_cache
def get_llm_provider() -> LLMProvider:
    return OpenRouterProvider()