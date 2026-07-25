import json
import pika

from app.core.config import settings

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