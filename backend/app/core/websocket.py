from fastapi import WebSocket

class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        conns = self._connections.get(user_id)
        if conns is not None:
            conns.discard(websocket)
            if not conns:
                del self._connections[user_id]
    async def send_to_user(self, user_id: int, message: dict) -> None:
        for websocket in list(self._connections.get(user_id, set())):
            await websocket.send_json(message)

manager = ConnectionManager()