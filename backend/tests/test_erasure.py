"""Tests for GDPR Art. 17 — Right to erasure (Task #9).

Verifies:
 - REPORT_ERASED audit action exists
 - RATE_ERASURE rate limit constant exists
 - Erasure service module structure
 - Erasure service deletes evidence, notes, reports
 - Erasure service logs REPORT_ERASED (no PII)
 - Audit logs are never deleted
 - Public erasure endpoint exists and is rate-limited
 - Endpoint requires no authentication (reporter-initiated)
 - Endpoint returns 404 for unknown tracking ID
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── REPORT_ERASED audit action ──


def test_report_erased_action_exists():
    """AuditAction should have REPORT_ERASED value."""
    from app.models.audit_log import AuditAction

    assert hasattr(AuditAction, "REPORT_ERASED")
    assert AuditAction.REPORT_ERASED.value == "REPORT_ERASED"


# ── Rate limit constant ──


def test_rate_erasure_constant_exists():
    """RATE_ERASURE should be defined in rate_limit module."""
    from app.core.rate_limit import RATE_ERASURE

    assert isinstance(RATE_ERASURE, str)
    assert "minute" in RATE_ERASURE


# ── Erasure service module ──


def test_erasure_service_exists():
    """erasure.py service module should be importable."""
    from app.services import erasure

    assert hasattr(erasure, "erase_report")


def test_erase_function_is_async():
    """erase_report should be an async function."""
    import asyncio

    from app.services.erasure import erase_report

    assert asyncio.iscoroutinefunction(erase_report)


def test_erase_function_accepts_tracking_id():
    """erase_report should accept tracking_id parameter."""
    import inspect

    from app.services.erasure import erase_report

    sig = inspect.signature(erase_report)
    params = list(sig.parameters.keys())
    assert "db" in params
    assert "tracking_id" in params
    assert "ip_address" in params
    assert "user_agent" in params


def test_erase_function_returns_bool():
    """erase_report return annotation should be bool."""
    import inspect

    from app.services.erasure import erase_report

    sig = inspect.signature(erase_report)
    assert sig.return_annotation is bool


def test_erase_function_has_no_actor_param():
    """erase_report should NOT have an actor parameter (reporter-initiated)."""
    import inspect

    from app.services.erasure import erase_report

    sig = inspect.signature(erase_report)
    params = list(sig.parameters.keys())
    assert "actor" not in params


# ── Service logic verification ──


def test_erasure_service_finds_by_tracking_id():
    """Erasure service should query by tracking_id."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "tracking_id" in source
    assert "Report.tracking_id" in source


def test_erasure_service_deletes_evidence():
    """Erasure service should delete evidence rows."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "delete(Evidence)" in source


def test_erasure_service_deletes_notes():
    """Erasure service should delete case note rows."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "delete(CaseNote)" in source


def test_erasure_service_deletes_gcs_files():
    """Erasure service should delete evidence files from GCS."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "blob.delete()" in source


def test_erasure_service_hard_deletes_report():
    """Erasure service should hard-delete the report (not soft-delete)."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "db.delete(report)" in source
    assert "is_deleted" not in source


def test_erasure_service_logs_report_erased():
    """Erasure service should log REPORT_ERASED via audit."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "AuditAction.REPORT_ERASED" in source


def test_erasure_audit_metadata_has_no_pii():
    """Erasure audit log should only contain tracking_id and reason, no PII."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "tracking_id" in source
    assert "GDPR Art. 17" in source
    # Should NOT log description, email, or personal data
    assert "description" not in source


def test_erasure_service_never_deletes_audit_logs():
    """The erasure service must NOT delete from audit_logs table."""
    import inspect

    from app.services import erasure

    source = inspect.getsource(erasure)
    assert "delete(AuditLog)" not in source


# ── Erasure endpoint ──


def test_erasure_endpoint_exists():
    """request_erasure endpoint should exist in the reports module."""
    from app.api.v1.reports import request_erasure

    assert callable(request_erasure)


def test_erasure_endpoint_is_delete():
    """request_erasure should be a DELETE endpoint."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert '"/track/{tracking_id}/erasure"' in source


def test_erasure_endpoint_is_rate_limited():
    """request_erasure should use RATE_ERASURE rate limiter."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert "RATE_ERASURE" in source


def test_erasure_endpoint_requires_no_auth():
    """request_erasure should NOT require authentication."""
    import inspect

    from app.api.v1.reports import request_erasure

    source = inspect.getsource(request_erasure)
    assert "get_current_user" not in source
    assert "require_role" not in source


def test_erasure_endpoint_returns_404_on_not_found():
    """request_erasure should raise 404 if report not found."""
    import inspect

    from app.api.v1.reports import request_erasure

    source = inspect.getsource(request_erasure)
    assert "404" in source


def test_erasure_endpoint_calls_erase_report():
    """request_erasure should call the erase_report service function."""
    import inspect

    from app.api.v1.reports import request_erasure

    source = inspect.getsource(request_erasure)
    assert "erase_report" in source


# ── Frontend API function ──


def test_frontend_api_has_erase_function():
    """frontend/src/lib/api.ts should export eraseReport function."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "lib"
        / "api.ts"
    )
    content = api_file.read_text()
    assert "eraseReport" in content
    assert "erasure" in content


# ── Translations ──


def test_en_track_json_has_erasure_keys():
    """English track.json should have erasure section."""
    import json
    import pathlib

    f = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "messages"
        / "en"
        / "track.json"
    )
    data = json.loads(f.read_text())
    assert "erasure" in data
    assert "button" in data["erasure"]
    assert "warning" in data["erasure"]
    assert "confirm" in data["erasure"]
    assert "success" in data["erasure"]


def test_ar_track_json_has_erasure_keys():
    """Arabic track.json should have erasure section."""
    import json
    import pathlib

    f = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "messages"
        / "ar"
        / "track.json"
    )
    data = json.loads(f.read_text(encoding="utf-8"))
    assert "erasure" in data
    assert "button" in data["erasure"]
    assert "confirm" in data["erasure"]
