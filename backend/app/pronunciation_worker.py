import json
import logging

import pika

import app.models  # noqa: F401  — регистрирует все модели в реестре SQLAlchemy
from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.pronunciation.queue import PRONUNCIATION_QUEUE
from app.modules.pronunciation.service import process_attempt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kodama.pronunciation_worker")


def _handle_message(channel, method, properties, body) -> None:
    attempt_id = json.loads(body)["attempt_id"]
    logger.info("Получена попытка attempt_id=%s", attempt_id)

    db = SessionLocal()
    try:
        process_attempt(db, attempt_id)
        logger.info("Попытка attempt_id=%s обработана", attempt_id)
    finally:
        db.close()

    channel.basic_ack(delivery_tag=method.delivery_tag)


def main() -> None:
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    channel = connection.channel()
    channel.queue_declare(queue=PRONUNCIATION_QUEUE, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=PRONUNCIATION_QUEUE, on_message_callback=_handle_message
    )

    logger.info("Воркер произношения запущен. Очередь '%s'...", PRONUNCIATION_QUEUE)
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    main()
