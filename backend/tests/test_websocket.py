"""Tests for Task #16 — WebSocket real-time notifications.

Verifies:
 - WSEvent class defines all 6 event types
 - ConnectionManager class exists with connect/disconnect/broadcast
 - manager module-level singleton exists
 - WebSocket endpoint registered at /ws/notifications
 - _authenticate_ws helper exists and checks JWT + active user
 - Broadcast calls integrated into reports/notes/evidence endpoints
 - Frontend useNotifications hook exists with correct types
 - Frontend NotificationToast component exists
 - Translation keys exist for notifications
 - ws_router registered in main.py
"""

import inspect
import json
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")


# ── WSEvent class ──


def test_ws_event_class_exists():
    """WSEvent should exist in ws module."""
    from app.api.v1.ws import WSEvent

    assert WSEvent is not None


def test_ws_event_has_all_types():
    """WSEvent should define all 6 event type constants."""
    from app.api.v1.ws import WSEvent

    expected = [
        "NEW_REPORT",
        "STATUS_CHANGED",
        "SEVERITY_CHANGED",
        "REPORT_DELETED",
        "NOTE_ADDED",
        "EVIDENCE_UPLOADED",
    ]
    for event in expected:
        assert hasattr(WSEvent, event), f"WSEvent missing {event}"
        assert getattr(WSEvent, event) == event


# ── ConnectionManager class ──


def test_connection_manager_exists():
    """ConnectionManager class should exist."""
    from app.api.v1.ws import ConnectionManager

    assert ConnectionManager is not None


def test_connection_manager_has_methods():
    """ConnectionManager should have connect, disconnect, broadcast."""
    from app.api.v1.ws import ConnectionManager

    assert hasattr(ConnectionManager, "connect")
    assert hasattr(ConnectionManager, "disconnect")
    assert hasattr(ConnectionManager, "broadcast")


def test_connection_manager_has_active_count():
    """ConnectionManager should have active_count property."""
    from app.api.v1.ws import ConnectionManager

    assert hasattr(ConnectionManager, "active_count")


def test_manager_singleton_exists():
    """Module-level manager singleton should exist."""
    from app.api.v1.ws import ConnectionManager, manager
    assert isinstance(manager, ConnectionManager)


def test_broadcast_sends_json():
    """broadcast should serialize event+data as JSON."""
    ws_mod = __import__(
        "app.api.v1.ws", fromlist=["ConnectionManager"],
    )
    src = inspect.getsource(ws_mod.ConnectionManager.broadcast)
    assert "json.dumps" in src
    assert '"event"' in src
    assert '"data"' in src


def test_broadcast_removes_dead_connections():
    """broadcast should track and remove dead connections."""
    ws_mod = __import__(
        "app.api.v1.ws", fromlist=["ConnectionManager"],
    )
    src = inspect.getsource(ws_mod.ConnectionManager.broadcast)
    assert "dead" in src
    assert "disconnect" in src


# ── Authentication helper ──


def test_authenticate_ws_exists():
    """_authenticate_ws helper should exist."""
    from app.api.v1.ws import _authenticate_ws

    assert callable(_authenticate_ws)


def test_authenticate_ws_checks_token():
    """_authenticate_ws should decode JWT and verify user is active."""
    ws_mod = __import__(
        "app.api.v1.ws", fromlist=["_authenticate_ws"],
    )
    src = inspect.getsource(ws_mod._authenticate_ws)
    assert "decode_access_token" in src
    assert "is_active" in src


# ── WebSocket endpoint ──


def test_ws_endpoint_exists():
    """ws_notifications endpoint should exist in router."""
    from app.api.v1.ws import router

    paths = [r.path for r in router.routes]
    assert "/ws/notifications" in paths


def test_ws_endpoint_checks_token():
    """ws_notifications should require token query param."""
    from app.api.v1.ws import ws_notifications

    src = inspect.getsource(ws_notifications)
    assert "token" in src
    assert "query_params" in src


def test_ws_endpoint_rejects_unauthorized():
    """ws_notifications should close with 4001 on bad auth."""
    from app.api.v1.ws import ws_notifications

    src = inspect.getsource(ws_notifications)
    assert "4001" in src
    assert "Unauthorized" in src


# ── Broadcast integration in reports.py ──


def test_reports_imports_ws_manager():
    """reports.py should import ws_manager."""
    mod = __import__(
        "app.api.v1.reports", fromlist=["submit_report"],
    )
    src = inspect.getsource(mod)
    assert "ws_manager" in src
    assert "WSEvent" in src


def test_submit_report_broadcasts_new_report():
    """submit_report should broadcast NEW_REPORT."""
    from app.api.v1.reports import submit_report

    src = inspect.getsource(submit_report)
    assert "WSEvent.NEW_REPORT" in src
    assert "ws_manager.broadcast" in src


def test_update_status_broadcasts():
    """update_status should broadcast STATUS_CHANGED."""
    from app.api.v1.reports import update_status

    src = inspect.getsource(update_status)
    assert "WSEvent.STATUS_CHANGED" in src
    assert "ws_manager.broadcast" in src


def test_update_severity_broadcasts():
    """update_severity should broadcast SEVERITY_CHANGED."""
    from app.api.v1.reports import update_severity

    src = inspect.getsource(update_severity)
    assert "WSEvent.SEVERITY_CHANGED" in src
    assert "ws_manager.broadcast" in src


def test_delete_report_broadcasts():
    """delete_report should broadcast REPORT_DELETED."""
    from app.api.v1.reports import delete_report

    src = inspect.getsource(delete_report)
    assert "WSEvent.REPORT_DELETED" in src
    assert "ws_manager.broadcast" in src


# ── Broadcast integration in notes.py ──


def test_notes_imports_ws_manager():
    """notes.py should import ws_manager."""
    mod = __import__(
        "app.api.v1.notes", fromlist=["add_note"],
    )
    src = inspect.getsource(mod)
    assert "ws_manager" in src


def test_add_note_broadcasts():
    """add_note should broadcast NOTE_ADDED."""
    from app.api.v1.notes import add_note

    src = inspect.getsource(add_note)
    assert "WSEvent.NOTE_ADDED" in src
    assert "ws_manager.broadcast" in src


# ── Broadcast integration in evidence.py ──


def test_evidence_imports_ws_manager():
    """evidence.py should import ws_manager."""
    mod = __import__(
        "app.api.v1.evidence", fromlist=["upload_evidence"],
    )
    src = inspect.getsource(mod)
    assert "ws_manager" in src


def test_upload_evidence_broadcasts():
    """upload_evidence should broadcast EVIDENCE_UPLOADED."""
    from app.api.v1.evidence import upload_evidence

    src = inspect.getsource(upload_evidence)
    assert "WSEvent.EVIDENCE_UPLOADED" in src
    assert "ws_manager.broadcast" in src


# ── ws_router in main.py ──


def test_ws_router_registered():
    """ws_router should be imported and included in main.py."""
    src = inspect.getsource(__import__("app.main", fromlist=["app"]))
    assert "ws_router" in src
    assert "include_router(ws_router)" in src


# ── Frontend: useNotifications hook ──


def test_use_notifications_hook_exists():
    """use-notifications.ts should exist."""
    hook = os.path.join(FRONTEND, "src", "hooks", "use-notifications.ts")
    assert os.path.isfile(hook), "use-notifications.ts not found"


def test_use_notifications_has_event_types():
    """use-notifications.ts should define all WSEventType values."""
    hook = os.path.join(FRONTEND, "src", "hooks", "use-notifications.ts")
    with open(hook, encoding="utf-8") as f:
        content = f.read()
    for event in [
        "NEW_REPORT",
        "STATUS_CHANGED",
        "SEVERITY_CHANGED",
        "REPORT_DELETED",
        "NOTE_ADDED",
        "EVIDENCE_UPLOADED",
    ]:
        assert event in content, f"Missing event type {event}"


def test_use_notifications_has_reconnect():
    """use-notifications.ts should implement exponential backoff reconnect."""
    hook = os.path.join(FRONTEND, "src", "hooks", "use-notifications.ts")
    with open(hook, encoding="utf-8") as f:
        content = f.read()
    assert "MAX_RECONNECT_DELAY" in content
    assert "retryRef" in content or "retry" in content


def test_use_notifications_dispatches_dom_event():
    """use-notifications.ts should dispatch sawtsafe:ws-event CustomEvent."""
    hook = os.path.join(FRONTEND, "src", "hooks", "use-notifications.ts")
    with open(hook, encoding="utf-8") as f:
        content = f.read()
    assert "sawtsafe:ws-event" in content
    assert "CustomEvent" in content


# ── Frontend: NotificationToast component ──


def test_notification_toast_component_exists():
    """notification-toast.tsx should exist."""
    comp = os.path.join(
        FRONTEND, "src", "components", "admin", "notification-toast.tsx",
    )
    assert os.path.isfile(comp), "notification-toast.tsx not found"


def test_notification_toast_uses_translations():
    """notification-toast.tsx should use translation keys."""
    comp = os.path.join(
        FRONTEND, "src", "components", "admin", "notification-toast.tsx",
    )
    with open(comp, encoding="utf-8") as f:
        content = f.read()
    assert "notifications." in content
    assert "useTranslations" in content


# ── Frontend: AdminHeader integration ──


def test_admin_header_imports_notifications():
    """admin-header.tsx should import useNotifications and NotificationToast."""
    header = os.path.join(
        FRONTEND, "src", "components", "admin", "admin-header.tsx",
    )
    with open(header, encoding="utf-8") as f:
        content = f.read()
    assert "useNotifications" in content
    assert "NotificationToast" in content


# ── Frontend: Dashboard auto-refresh ──


def test_dashboard_listens_for_ws_event():
    """Dashboard should listen for sawtsafe:ws-event to auto-refresh."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "dashboard", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    assert len(matches) > 0, "Dashboard page not found"
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "sawtsafe:ws-event" in content
    assert "fetchReports" in content


# ── Translation keys ──


def test_en_notification_keys():
    """English admin.json should have notifications section."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "admin.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    notifs = data.get("notifications", {})
    expected_keys = [
        "title", "clearAll", "empty", "connected", "disconnected",
        "newReport", "statusChanged", "severityChanged",
        "reportDeleted", "noteAdded", "evidenceUploaded",
    ]
    for key in expected_keys:
        assert key in notifs, f"Missing EN notification key: {key}"


def test_ar_notification_keys():
    """Arabic admin.json should have notifications section."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "admin.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    notifs = data.get("notifications", {})
    expected_keys = [
        "title", "clearAll", "empty", "connected", "disconnected",
        "newReport", "statusChanged", "severityChanged",
        "reportDeleted", "noteAdded", "evidenceUploaded",
    ]
    for key in expected_keys:
        assert key in notifs, f"Missing AR notification key: {key}"
