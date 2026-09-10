import logging
from functools import lru_cache
from typing import Protocol

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider(Protocol):
    """Абстракция LLM-провайдера: «дай текст по промпту».
    Реализации: OpenRouter (сейчас), локальная LLM (позже)."""

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        ...


class AllModelsFailedError(Exception):
    """Ни одна модель из фолбек-цепочки не ответила."""


class OpenRouterProvider:
    def __init__(self) -> None:
        self._client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )
        self._models = settings.llm_model_list

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        # Бесплатные модели на OpenRouter то теряют :free-статус, то временно
        # перегружены у апстрим-провайдера (429) — пробуем по очереди, пока
        # какая-то не ответит. Порядок задаёт settings.llm_models.
        last_error: Exception | None = None
        for model in self._models:
            try:
                response = self._client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )
                content = response.choices[0].message.content
                if not content:
                    raise ValueError("модель вернула пустой ответ")
                return content
            except Exception as e:
                logger.warning("LLM-модель %s не ответила (%s), пробуем следующую", model, e)
                last_error = e
        raise AllModelsFailedError(
            f"Ни одна модель не ответила: {self._models}"
        ) from last_error

@lru_cache
def get_llm_provider() -> LLMProvider:
    return OpenRouterProvider()