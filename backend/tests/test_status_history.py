"""Tests for Task #10 — Per-step timestamps (status_history).

Verifies:
 - Report model has status_history JSONB column
 - StatusHistoryEntry schema exists
 - ReportPublic, ReportDetail, ReportListItem include status_history
 - submit_report initializes status_history with OPEN entry
 - update_status appends new entry to status_history
 - track_report returns status_history
 - Lifespan migration adds column
 - Frontend TrackResult includes status_history
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Model: status_history column ──


def test_report_model_has_status_history():
    """Report model should have status_history column."""
    from app.models.report import Report

    assert hasattr(Report, "status_history")


def test_status_history_column_is_jsonb():
    """status_history should be JSONB type."""
    import inspect

    from app.models import report

    source = inspect.getsource(report)
    assert "JSONB" in source
    assert "status_history" in source


def test_status_history_column_is_nullable():
    """status_history should be nullable with default list."""
    import inspect

    from app.models import report

    source = inspect.getsource(report)
    assert "nullable=True" in source
    assert "default=list" in source


# ── Schema: StatusHistoryEntry ──


def test_status_history_entry_schema_exists():
    """StatusHistoryEntry schema should exist."""
    from app.schemas.report import StatusHistoryEntry

    assert StatusHistoryEntry is not None


def test_status_history_entry_has_status_field():
    """StatusHistoryEntry should have a status field."""
    from app.schemas.report import StatusHistoryEntry

    fields = StatusHistoryEntry.model_fields
    assert "status" in fields


def test_status_history_entry_has_at_field():
    """StatusHistoryEntry should have an at field (datetime)."""
    from app.schemas.report import StatusHistoryEntry

    fields = StatusHistoryEntry.model_fields
    assert "at" in fields


# ── Schema: ReportPublic includes status_history ──


def test_report_public_has_status_history():
    """ReportPublic should include status_history field."""
    from app.schemas.report import ReportPublic

    fields = ReportPublic.model_fields
    assert "status_history" in fields


def test_report_public_status_history_default_empty():
    """ReportPublic.status_history should default to empty list."""
    from app.schemas.report import ReportPublic

    field = ReportPublic.model_fields["status_history"]
    assert field.default == []


# ── Schema: ReportDetail includes status_history ──


def test_report_detail_has_status_history():
    """ReportDetail should include status_history field."""
    from app.schemas.report import ReportDetail

    fields = ReportDetail.model_fields
    assert "status_history" in fields


# ── Schema: ReportListItem includes status_history ──


def test_report_list_item_has_status_history():
    """ReportListItem should include status_history field."""
    from app.schemas.report import ReportListItem

    fields = ReportListItem.model_fields
    assert "status_history" in fields


# ── submit_report initializes status_history ──


def test_submit_report_initializes_status_history():
    """submit_report should set status_history with initial OPEN entry."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.submit_report)
    assert "status_history" in source
    assert "OPEN" in source


def test_submit_report_includes_timestamp():
    """submit_report status_history entry should include ISO timestamp."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.submit_report)
    assert "isoformat()" in source


# ── update_status appends to status_history ──


def test_update_status_appends_to_history():
    """update_status should append new entry to status_history."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    assert "status_history" in source
    assert "append" in source


def test_update_status_records_timestamp():
    """update_status should record timestamp when appending."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    assert "isoformat()" in source


def test_update_status_reads_existing_history():
    """update_status should read existing history before appending."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    assert "report.status_history" in source


# ── track_report returns status_history ──


def test_track_report_returns_status_history():
    """track_report response should include status_history field."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.track_report)
    assert "status_history" in source


# ── Lifespan migration ──


def test_lifespan_adds_status_history_column():
    """Lifespan should add status_history column to reports table."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "status_history" in source
    assert "JSONB" in source


# ── Frontend: TrackResult and api.ts ──


def test_frontend_api_has_status_history():
    """frontend/src/lib/api.ts should include status_history in ReportStatus."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "lib"
        / "api.ts"
    )
    content = api_file.read_text()
    assert "status_history" in content
    assert "StatusHistoryEntry" in content


def test_frontend_track_page_has_status_history():
    """Track page should reference status_history for timeline timestamps."""
    import pathlib

    track_dir = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "app"
    )
    # Find track page (may be under [locale])
    found = list(track_dir.rglob("track/page.tsx"))
    assert len(found) > 0, "Track page.tsx not found"
    content = found[0].read_text(encoding="utf-8")
    assert "status_history" in content
    assert "historyEntry" in content


def test_frontend_track_page_shows_timestamps():
    """Track page timeline should format timestamps from status_history."""
    import pathlib

    track_dir = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "app"
    )
    found = list(track_dir.rglob("track/page.tsx"))
    content = found[0].read_text(encoding="utf-8")
    assert "formatDate(historyEntry.at)" in content
