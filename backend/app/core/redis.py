from functools import lru_cache

import redis

from app.core.config import settings


@lru_cache
def get_redis() -> redis.Redis:
    """Ленивый синглтон Redis-клиента. decode_responses=True — строки, не bytes."""
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        decode_responses=True,
    )
