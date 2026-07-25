from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.core.websocket import manager
from app.modules.auth.models import User

router = APIRouter()

def _authenticate(token: str | None) -> User | None:
    if token is None:
        return None
    subject = decode_access_token(token)
    if subject is None:
        return None
    db = SessionLocal()
    try:
        return db.scalar(select(User).where(User.id == int(subject)))
    finally:
        db.close()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str | None = None) -> None:
    user = _authenticate(token)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text() # держим соединение; входящее игнорируем
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)