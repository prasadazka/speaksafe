"""Tests for data retention & auto-purge (Task #8).

Verifies:
 - Configurable RETENTION_DAYS setting
 - REPORT_PURGED audit action exists
 - Retention service module structure
 - Purge endpoint exists and is ADMIN-only
 - Service deletes evidence, notes, and reports
 - Audit logs are never deleted
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Configurable RETENTION_DAYS ──


def test_config_has_retention_days():
    """Settings should have RETENTION_DAYS with default 365."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
    )
    assert s.RETENTION_DAYS == 365


def test_config_retention_days_customizable():
    """RETENTION_DAYS should be overridable."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
        RETENTION_DAYS=180,
    )
    assert s.RETENTION_DAYS == 180


# ── REPORT_PURGED audit action ──


def test_report_purged_action_exists():
    """AuditAction should have REPORT_PURGED value."""
    from app.models.audit_log import AuditAction

    assert hasattr(AuditAction, "REPORT_PURGED")
    assert AuditAction.REPORT_PURGED.value == "REPORT_PURGED"


# ── Retention service module ──


def test_retention_service_exists():
    """retention.py service module should be importable."""
    from app.services import retention

    assert hasattr(retention, "purge_expired_reports")


def test_purge_function_is_async():
    """purge_expired_reports should be an async function."""
    import asyncio

    from app.services.retention import purge_expired_reports

    assert asyncio.iscoroutinefunction(purge_expired_reports)


def test_purge_function_accepts_actor():
    """purge_expired_reports should accept actor parameter."""
    import inspect

    from app.services.retention import purge_expired_reports

    sig = inspect.signature(purge_expired_reports)
    params = list(sig.parameters.keys())
    assert "db" in params
    assert "actor" in params
    assert "ip_address" in params
    assert "user_agent" in params


def test_purge_function_returns_int():
    """purge_expired_reports return annotation should be int."""
    import inspect

    from app.services.retention import purge_expired_reports

    sig = inspect.signature(purge_expired_reports)
    assert sig.return_annotation is int


def test_retention_service_uses_retention_days():
    """Retention service should reference settings.RETENTION_DAYS."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "settings.RETENTION_DAYS" in source


def test_retention_service_filters_closed_reports():
    """Retention service should filter for CLOSED status."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "ReportStatus.CLOSED" in source


def test_retention_service_checks_feedback_given_at():
    """Retention service should check feedback_given_at for cutoff."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "feedback_given_at" in source


def test_retention_service_deletes_evidence():
    """Retention service should delete evidence rows."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "delete(Evidence)" in source


def test_retention_service_deletes_notes():
    """Retention service should delete case note rows."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "delete(CaseNote)" in source


def test_retention_service_deletes_gcs_files():
    """Retention service should delete evidence files from GCS."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "blob.delete()" in source


def test_retention_service_logs_purge_action():
    """Retention service should log REPORT_PURGED via audit."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "AuditAction.REPORT_PURGED" in source


def test_retention_service_logs_metadata():
    """Purge audit log should include tracking_id and retention_days."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "tracking_id" in source
    assert "retention_days" in source
    assert "evidence_files_deleted" in source


# ── Purge endpoint ──


def test_purge_endpoint_exists():
    """retention_purge endpoint should exist in the reports module."""
    from app.api.v1.reports import retention_purge

    assert callable(retention_purge)


def test_purge_endpoint_is_post():
    """retention_purge should be a POST endpoint."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert '"/retention/purge"' in source


def test_purge_endpoint_requires_admin_role():
    """retention_purge should use require_role(AdminRole.ADMIN)."""
    import inspect

    from app.api.v1.reports import retention_purge

    source = inspect.getsource(retention_purge)
    assert "require_role" in source
    assert "AdminRole.ADMIN" in source


def test_purge_endpoint_returns_purged_count():
    """retention_purge response should include purged_count."""
    import inspect

    from app.api.v1.reports import retention_purge

    source = inspect.getsource(retention_purge)
    assert "purged_count" in source


def test_purge_endpoint_returns_retention_days():
    """retention_purge response should include retention_days."""
    import inspect

    from app.api.v1.reports import retention_purge

    source = inspect.getsource(retention_purge)
    assert "retention_days" in source


def test_purge_endpoint_passes_request_context():
    """retention_purge should pass IP and user-agent to purge function."""
    import inspect

    from app.api.v1.reports import retention_purge

    source = inspect.getsource(retention_purge)
    assert "ip_address" in source
    assert "user_agent" in source


# ── .env.example ──


def test_env_example_has_retention_days():
    """The .env.example file should document RETENTION_DAYS."""
    import pathlib

    env_file = pathlib.Path(__file__).parent.parent.parent / ".env.example"
    content = env_file.read_text()
    assert "RETENTION_DAYS" in content


# ── Audit logs are never deleted ──


def test_retention_service_never_deletes_audit_logs():
    """The retention service must NOT delete from audit_logs table."""
    import inspect

    from app.services import retention

    source = inspect.getsource(retention)
    assert "delete(AuditLog)" not in source
