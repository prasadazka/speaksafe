"""Tests for Task #13 — Full before/after snapshots in audit metadata.

Verifies:
 - _snapshot_report helper exists and captures key fields
 - _snapshot_user helper exists and captures key fields
 - update_status includes before/after in audit metadata
 - update_severity includes before/after in audit metadata
 - delete_report includes before/after in audit metadata
 - update_user_role includes before/after in audit metadata
 - update_user_active includes before/after in audit metadata
 - delete_user includes before snapshot in audit metadata
 - Snapshots exclude PII (no description, no password_hash)
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── _snapshot_report helper ──


def test_snapshot_report_exists():
    """_snapshot_report should exist in reports module."""
    from app.api.v1.reports import _snapshot_report

    assert callable(_snapshot_report)


def test_snapshot_report_source_has_key_fields():
    """_snapshot_report should capture status, severity, category, assigned_to, is_deleted."""
    import inspect

    from app.api.v1.reports import _snapshot_report

    source = inspect.getsource(_snapshot_report)
    assert "status" in source
    assert "severity" in source
    assert "category" in source
    assert "assigned_to" in source
    assert "is_deleted" in source


def test_snapshot_report_excludes_description():
    """_snapshot_report should NOT include description (PII)."""
    import inspect

    from app.api.v1.reports import _snapshot_report

    source = inspect.getsource(_snapshot_report)
    assert "description" not in source


# ── _snapshot_user helper ──


def test_snapshot_user_exists():
    """_snapshot_user should exist in auth module."""
    from app.api.v1.auth import _snapshot_user

    assert callable(_snapshot_user)


def test_snapshot_user_source_has_key_fields():
    """_snapshot_user should capture email, role, is_active, mfa_enabled."""
    import inspect

    from app.api.v1.auth import _snapshot_user

    source = inspect.getsource(_snapshot_user)
    assert "email" in source
    assert "role" in source
    assert "is_active" in source
    assert "mfa_enabled" in source


def test_snapshot_user_excludes_password():
    """_snapshot_user should NOT include password_hash."""
    import inspect

    from app.api.v1.auth import _snapshot_user

    source = inspect.getsource(_snapshot_user)
    assert "password_hash" not in source


# ── update_status has before/after ──


def test_update_status_has_before_after():
    """update_status audit should include before and after snapshots."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    assert '"before": before' in source or "'before': before" in source
    assert '"after": after' in source or "'after': after" in source


def test_update_status_calls_snapshot_before_change():
    """update_status should call _snapshot_report before modifying the report."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    # before = _snapshot_report(report) should appear before report.status = ...
    snap_idx = source.index("_snapshot_report")
    status_idx = source.index("report.status = payload.status")
    assert snap_idx < status_idx


# ── update_severity has before/after ──


def test_update_severity_has_before_after():
    """update_severity audit should include before and after snapshots."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_severity)
    assert '"before": before' in source or "'before': before" in source
    assert '"after": after' in source or "'after': after" in source


# ── delete_report has before/after ──


def test_delete_report_has_before_after():
    """delete_report audit should include before and after snapshots."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.delete_report)
    assert '"before": before' in source or "'before': before" in source
    assert '"after": after' in source or "'after': after" in source


# ── update_user_role has before/after ──


def test_update_user_role_has_before_after():
    """update_user_role audit should include before and after snapshots."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.update_user_role)
    assert '"before": before' in source or "'before': before" in source
    assert '"after": after' in source or "'after': after" in source


def test_update_user_role_calls_snapshot_before_change():
    """update_user_role should call _snapshot_user before modifying the target."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.update_user_role)
    snap_idx = source.index("_snapshot_user")
    role_idx = source.index("target.role = payload.role")
    assert snap_idx < role_idx


# ── update_user_active has before/after ──


def test_update_user_active_has_before_after():
    """update_user_active audit should include before and after snapshots."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.update_user_active)
    assert '"before": before' in source or "'before': before" in source
    assert '"after": after' in source or "'after': after" in source


# ── delete_user has before snapshot ──


def test_delete_user_has_before_snapshot():
    """delete_user audit should include before snapshot."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.delete_user)
    assert '"before": before' in source or "'before': before" in source
    assert "_snapshot_user" in source
