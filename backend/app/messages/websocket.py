from fastapi import WebSocket

from app.auth.security import get_user_from_token


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, set[WebSocket]] = {}

    async def connect(
      self,
      websocket: WebSocket,
      token: str,
    ):
      user = await get_user_from_token(token)

      if not user:
        await websocket.close(code=1008)
        return None

      user_id = str(user["_id"])

      if user_id not in self.connections:
        self.connections[user_id] = set()

      self.connections[user_id].add(websocket)

      return user_id

    def disconnect(
        self,
        user_id: str,
        websocket: WebSocket,
    ):
        connections = self.connections.get(user_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.connections.pop(user_id, None)

    def is_online(self, user_id: str):
        return bool(
            self.connections.get(user_id)
        )

    async def send_to_user(
        self,
        user_id: str,
        data: dict,
    ):
        connections = self.connections.get(user_id, set())

        for websocket in list(connections):
            try:
                await websocket.send_json(data)
            except Exception:
                connections.discard(websocket)

    async def send_to_users(
        self,
        user_ids: list[str],
        data: dict,
    ):
        for user_id in user_ids:
            await self.send_to_user(
                user_id,
                data,
            )


manager = ConnectionManager()