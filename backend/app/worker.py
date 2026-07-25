import json
import logging

import pika

from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.ai.provider import get_llm_provider
from app.modules.ai.queue import GENERATION_QUEUE
from app.modules.ai.service import process_job

import app.models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kodama.worker")

def _handle_message(channel, method, properties, body) -> None:
    job_id = json.loads(body)["job_id"]
    logger.info("Получена задача job_id=%s", job_id)

    db = SessionLocal()
    try:
        process_job(db, get_llm_provider(), job_id)
        logger.info("Задача job_id=%s обработана", job_id)
    finally:
        db.close()

    channel.basic_ack(delivery_tag=method.delivery_tag)

def main() -> None:
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    channel = connection.channel()
    channel.queue_declare(queue=GENERATION_QUEUE, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=GENERATION_QUEUE, on_message_callback=_handle_message)

    logger.info("Воркер запущен. Ожидаю задачи из очереди '%s'...", GENERATION_QUEUE)
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    main()