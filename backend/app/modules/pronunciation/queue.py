import json

import pika

from app.core.config import settings

PRONUNCIATION_QUEUE = "pronunciation"


def publish_attempt(attempt_id: int) -> None:
    """Вторая очередь, независимая от очереди генерации колод."""
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    try:
        channel = connection.channel()
        channel.queue_declare(queue=PRONUNCIATION_QUEUE, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=PRONUNCIATION_QUEUE,
            body=json.dumps({"attempt_id": attempt_id}),
            properties=pika.BasicProperties(delivery_mode=2),  # persistent
        )
    finally:
        connection.close()
