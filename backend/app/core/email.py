import logging
import smtplib
from email.message import EmailMessage
from functools import lru_cache
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger("kodama.email")


class EmailSender(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class SmtpEmailSender:
    def send(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_user
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)


class ConsoleEmailSender:
    """Для локальной разработки: печатает письмо в лог вместо отправки."""

    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("EMAIL -> %s | %s\n%s", to, subject, body)


@lru_cache
def get_email_sender() -> EmailSender:
    if settings.email_backend == "smtp":
        return SmtpEmailSender()
    return ConsoleEmailSender()