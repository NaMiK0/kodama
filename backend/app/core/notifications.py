import json
from typing import Any

import pika

from app.core.config import settings

NOTIFICATIONS_EXCHANGE = "notifications"


def publish_notification(payload: dict[str, Any]) -> None:
    """Публикует уведомление в общий fanout-exchange.

    payload ОБЯЗАН содержать "user_id" — по нему WS-мост находит адресата.
    Доставка best-effort: если слушателей нет, сообщение теряется
    (источник правды о статусе — БД, клиент дозапросит её при переподключении).
    """
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    try:
        channel = connection.channel()
        channel.exchange_declare(
            exchange=NOTIFICATIONS_EXCHANGE, exchange_type="fanout", durable=True
        )
        channel.basic_publish(
            exchange=NOTIFICATIONS_EXCHANGE,
            routing_key="",  # fanout игнорирует routing_key
            body=json.dumps(payload),
        )
    finally:
        connection.close()
