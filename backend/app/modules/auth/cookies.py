from fastapi import Response

from app.core.config import settings


def set_auth_cookie(response: Response, token: str) -> None:
    """Кладёт JWT в куку, недоступную JavaScript.

    httponly — скрипт на странице не сможет прочитать токен (защита от XSS).
    samesite=lax — браузер не приложит куку к межсайтовым POST/PUT/DELETE,
    то есть чужой сайт не сможет выполнить наши мутации (защита от CSRF).
    """
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    """Единственный способ «выйти»: JS куку не видит и удалить не может."""
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/",
    )
