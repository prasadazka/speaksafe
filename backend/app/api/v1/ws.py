"""WebSocket real-time notifications for admin dashboard.

Admins connect via ``ws://host/ws/notifications?token=<JWT>``.
Events are broadcast to all connected clients when reports are
created, status/severity changed, notes added, or evidence uploaded.
"""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.security import decode_access_token
from app.db.session import async_session
from app.models.admin_user import AdminUser

router = APIRouter()


# ── Event types ──

class WSEvent:
    NEW_REPORT = "NEW_REPORT"
    STATUS_CHANGED = "STATUS_CHANGED"
    SEVERITY_CHANGED = "SEVERITY_CHANGED"
    REPORT_DELETED = "REPORT_DELETED"
    NOTE_ADDED = "NOTE_ADDED"
    EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"


# ── Connection Manager (module-level singleton) ──


class ConnectionManager:
    """Track active WebSocket connections and broadcast events."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._connections:
            self._connections.remove(ws)

    @property
    def active_count(self) -> int:
        return len(self._connections)

    async def broadcast(
        self,
        event: str,
        data: dict | None = None,
    ) -> None:
        """Send a JSON message to every connected client."""
        message = json.dumps({"event": event, "data": data or {}})
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


async def _authenticate_ws(token: str) -> bool:
    """Verify JWT and check user exists + active."""
    user_id = decode_access_token(token)
    if not user_id:
        return False
    async with async_session() as db:
        result = await db.execute(
            select(AdminUser.id).where(
                AdminUser.id == uuid.UUID(user_id),
                AdminUser.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none() is not None


# ── WebSocket Endpoint ──


@router.websocket("/ws/notifications")
async def ws_notifications(ws: WebSocket) -> None:
    """Authenticated WebSocket for real-time admin notifications."""
    token = ws.query_params.get("token")
    if not token or not await _authenticate_ws(token):
        await ws.close(code=4001, reason="Unauthorized")
        return

    await manager.connect(ws)
    try:
        # Keep connection alive — wait for client disconnect
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
