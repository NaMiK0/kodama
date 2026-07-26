import secrets
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.redis import get_redis

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

_STATE_TTL = 600  # 10 минут — на прохождение экрана согласия хватает с запасом


class OAuthError(Exception):
    """Не удалось получить данные пользователя от Google."""


def _state_key(state: str) -> str:
    return f"oauth:state:{state}"


def create_state() -> str:
    """Одноразовый state против CSRF: кладём в Redis на короткий срок."""
    state = secrets.token_urlsafe(32)
    get_redis().set(_state_key(state), "1", ex=_STATE_TTL)
    return state


def consume_state(state: str) -> bool:
    """Проверяет state и сразу удаляет его. True — если он был валиден."""
    return get_redis().delete(_state_key(state)) == 1


def build_authorization_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def fetch_google_user(code: str) -> tuple[str, str]:
    """Меняет одноразовый код на профиль Google. Возвращает (email, google_id).

    Обмен идёт сервер-к-серверу: client_secret не покидает бэкенд.
    """
    with httpx.Client(timeout=15) as client:
        token_response = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise OAuthError("Google не принял код авторизации")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise OAuthError("Google не вернул access_token")

        userinfo_response = client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise OAuthError("Не удалось получить профиль Google")

    profile = userinfo_response.json()
    email, google_id = profile.get("email"), profile.get("sub")
    if not email or not google_id:
        raise OAuthError("В профиле Google нет email")
    if not profile.get("email_verified", False):
        # Иначе по неподтверждённому адресу можно было бы захватить чужой аккаунт
        raise OAuthError("Email в аккаунте Google не подтверждён")

    return email.lower(), google_id
