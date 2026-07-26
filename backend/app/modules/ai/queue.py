import json
import pika

from app.core.config import settings
from app.core.notifications import publish_notification as core_publish_notification

GENERATION_QUEUE = "deck_generation"

def publish_generation_job(job_id: int) -> None:
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    try:
        channel = connection.channel()
        channel.queue_declare(queue=GENERATION_QUEUE, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=GENERATION_QUEUE,
            body=json.dumps({"job_id": job_id}),
            properties=pika.BasicProperties(delivery_mode=2),
        )
    finally:
        connection.close()


def publish_notification(
    user_id: int, job_id: int, status: str, deck_id: int | None
) -> None:
    """Уведомление о готовности сгенерированной колоды.
    Транспорт общий (app/core/notifications.py) — им же пользуется произношение."""
    core_publish_notification(
        {
            "type": "generation",
            "user_id": user_id,
            "job_id": job_id,
            "status": status,
            "deck_id": deck_id,
        }
    )