"""Tests for Task #17 — Access logging.

Verifies:
 - REPORT_VIEWED exists in AuditAction enum
 - get_report endpoint logs REPORT_VIEWED via log_action
 - get_access_log endpoint exists with correct route and signature
 - get_access_log filters by REPORT_VIEWED action
 - Frontend admin-api has REPORT_VIEWED type and getAccessLog function
 - Case detail page imports getAccessLog and shows access log tab
 - Translation keys exist for access log
"""

import inspect
import json
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")


# ── REPORT_VIEWED enum value ──


def test_report_viewed_in_audit_action():
    """AuditAction should have REPORT_VIEWED."""
    from app.models.audit_log import AuditAction

    assert hasattr(AuditAction, "REPORT_VIEWED")
    assert AuditAction.REPORT_VIEWED.value == "REPORT_VIEWED"


# ── get_report logs view ──


def test_get_report_logs_view():
    """get_report should call log_action with REPORT_VIEWED."""
    from app.api.v1.reports import get_report

    src = inspect.getsource(get_report)
    assert "REPORT_VIEWED" in src
    assert "log_action" in src


def test_get_report_has_request_param():
    """get_report should accept request for IP/UA logging."""
    from app.api.v1.reports import get_report

    sig = inspect.signature(get_report)
    assert "request" in sig.parameters


def test_get_report_has_user_param():
    """get_report should accept user (not _user) for actor."""
    from app.api.v1.reports import get_report

    sig = inspect.signature(get_report)
    assert "user" in sig.parameters


def test_get_report_logs_tracking_id():
    """get_report view log should include tracking_id in metadata."""
    from app.api.v1.reports import get_report

    src = inspect.getsource(get_report)
    assert "tracking_id" in src


# ── get_access_log endpoint ──


def test_access_log_endpoint_exists():
    """get_access_log endpoint should exist in reports router."""
    from app.api.v1.reports import get_access_log

    assert callable(get_access_log)


def test_access_log_endpoint_route():
    """access-log should be registered at the correct route."""
    from app.api.v1.reports import router

    paths = [r.path for r in router.routes]
    assert any("access-log" in p for p in paths)


def test_access_log_filters_by_viewed():
    """get_access_log should filter by REPORT_VIEWED action."""
    from app.api.v1.reports import get_access_log

    src = inspect.getsource(get_access_log)
    assert "REPORT_VIEWED" in src
    assert "AuditAction.REPORT_VIEWED" in src


def test_access_log_orders_desc():
    """get_access_log should order by created_at descending."""
    from app.api.v1.reports import get_access_log

    src = inspect.getsource(get_access_log)
    assert "desc()" in src


def test_access_log_checks_report_exists():
    """get_access_log should verify report exists before querying."""
    from app.api.v1.reports import get_access_log

    src = inspect.getsource(get_access_log)
    assert "Report not found" in src


def test_access_log_requires_auth():
    """get_access_log should require authentication."""
    from app.api.v1.reports import get_access_log

    sig = inspect.signature(get_access_log)
    assert "_user" in sig.parameters


# ── Frontend: admin-api ──


def test_frontend_has_report_viewed_type():
    """admin-api.ts should include REPORT_VIEWED in AuditAction."""
    path = os.path.join(FRONTEND, "src", "lib", "admin-api.ts")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "REPORT_VIEWED" in content


def test_frontend_has_get_access_log():
    """admin-api.ts should export getAccessLog function."""
    path = os.path.join(FRONTEND, "src", "lib", "admin-api.ts")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "getAccessLog" in content
    assert "access-log" in content


# ── Frontend: case detail page ──


def test_case_detail_imports_access_log():
    """Case detail page should import getAccessLog."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "cases",
        "*", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    assert len(matches) > 0
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "getAccessLog" in content


def test_case_detail_has_access_log_tab():
    """Case detail page should have an access-log tab."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "cases",
        "*", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "access-log" in content
    assert "accessLog" in content


def test_case_detail_has_report_viewed_in_timeline():
    """Case detail should handle REPORT_VIEWED in timeline config."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "cases",
        "*", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "REPORT_VIEWED" in content
    assert "Eye" in content


# ── Translation keys ──


def test_en_access_log_keys():
    """English admin.json should have accessLog section."""
    path = os.path.join(
        FRONTEND, "src", "messages", "en", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    al = data.get("accessLog", {})
    for key in ["title", "subtitle", "noAccess", "viewedReport"]:
        assert key in al, f"Missing EN accessLog key: {key}"


def test_ar_access_log_keys():
    """Arabic admin.json should have accessLog section."""
    path = os.path.join(
        FRONTEND, "src", "messages", "ar", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    al = data.get("accessLog", {})
    for key in ["title", "subtitle", "noAccess", "viewedReport"]:
        assert key in al, f"Missing AR accessLog key: {key}"


def test_en_timeline_report_viewed_key():
    """English timeline should have reportViewed key."""
    path = os.path.join(
        FRONTEND, "src", "messages", "en", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    assert "reportViewed" in data.get("timeline", {})


def test_ar_timeline_report_viewed_key():
    """Arabic timeline should have reportViewed key."""
    path = os.path.join(
        FRONTEND, "src", "messages", "ar", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    assert "reportViewed" in data.get("timeline", {})
