import json

import aio_pika

from app.core.config import settings
from app.core.websocket import manager
from app.core.notifications import NOTIFICATIONS_EXCHANGE

async def consume_notifications() -> None:
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()
    exchange = await channel.declare_exchange(
        NOTIFICATIONS_EXCHANGE,
        aio_pika.ExchangeType.FANOUT,
        durable=True
    )
    queue = await channel.declare_queue(exclusive=True)

    await queue.bind(exchange)

    async with queue.iterator() as messages:
        async for message in messages:
            async with message.process():
                try:
                    payload = json.loads(message.body)
                    await manager.send_to_user(payload["user_id"], payload)
                except Exception:
                    pass # best-effort: одно битое уведомление не роняет консьюмер