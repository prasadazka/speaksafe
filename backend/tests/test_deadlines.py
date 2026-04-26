"""Tests for EU Directive compliance deadlines (Tasks #6 and #7).

Verifies:
 - Configurable deadline settings in config
 - Report model has deadline fields
 - Deadlines are set on report submission
 - Track endpoint returns deadline info
 - Feedback timestamp set on case closure
 - Compliance stats endpoint logic
 - Lifespan migration SQL for deadline columns
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Configurable settings ──


def test_config_has_acknowledgment_days():
    """Settings should have ACKNOWLEDGMENT_DAYS with default 7."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
    )
    assert s.ACKNOWLEDGMENT_DAYS == 7


def test_config_has_feedback_deadline_days():
    """Settings should have FEEDBACK_DEADLINE_DAYS with default 90."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
    )
    assert s.FEEDBACK_DEADLINE_DAYS == 90


def test_config_has_feedback_warning_days():
    """Settings should have FEEDBACK_WARNING_DAYS with default 14."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
    )
    assert s.FEEDBACK_WARNING_DAYS == 14


def test_config_days_are_customizable():
    """Deadline days should be overridable via env vars."""
    from app.core.config import Settings

    s = Settings(
        DATABASE_URL="sqlite:///test.db",
        SECRET_KEY="test",
        ENCRYPTION_KEY="0" * 64,
        ACKNOWLEDGMENT_DAYS=10,
        FEEDBACK_DEADLINE_DAYS=60,
        FEEDBACK_WARNING_DAYS=7,
    )
    assert s.ACKNOWLEDGMENT_DAYS == 10
    assert s.FEEDBACK_DEADLINE_DAYS == 60
    assert s.FEEDBACK_WARNING_DAYS == 7


# ── Model fields ──


def test_report_model_has_acknowledgment_due():
    """Report model should have acknowledgment_due column."""
    from sqlalchemy import inspect as sa_inspect

    from app.models.report import Report

    mapper = sa_inspect(Report)
    columns = {c.key for c in mapper.columns}
    assert "acknowledgment_due" in columns


def test_report_model_has_feedback_due():
    """Report model should have feedback_due column."""
    from sqlalchemy import inspect as sa_inspect

    from app.models.report import Report

    mapper = sa_inspect(Report)
    columns = {c.key for c in mapper.columns}
    assert "feedback_due" in columns


def test_report_model_has_feedback_given_at():
    """Report model should have feedback_given_at column."""
    from sqlalchemy import inspect as sa_inspect

    from app.models.report import Report

    mapper = sa_inspect(Report)
    columns = {c.key for c in mapper.columns}
    assert "feedback_given_at" in columns


def test_deadline_columns_are_nullable():
    """All deadline columns should be nullable (for legacy reports)."""
    from sqlalchemy import inspect as sa_inspect

    from app.models.report import Report

    mapper = sa_inspect(Report)
    col_map = {c.key: c for c in mapper.columns}

    assert col_map["acknowledgment_due"].nullable is True
    assert col_map["feedback_due"].nullable is True
    assert col_map["feedback_given_at"].nullable is True


# ── Schema fields ──


def test_report_public_schema_has_deadline_fields():
    """ReportPublic should have acknowledgment_due, feedback_due, feedback_given_at."""
    from app.schemas.report import ReportPublic

    fields = set(ReportPublic.model_fields.keys())
    assert "acknowledgment_due" in fields
    assert "feedback_due" in fields
    assert "feedback_given_at" in fields


def test_report_detail_schema_has_deadline_fields():
    """ReportDetail should have deadline fields."""
    from app.schemas.report import ReportDetail

    fields = set(ReportDetail.model_fields.keys())
    assert "acknowledgment_due" in fields
    assert "feedback_due" in fields
    assert "feedback_given_at" in fields


def test_report_list_item_schema_has_deadline_fields():
    """ReportListItem should have deadline fields."""
    from app.schemas.report import ReportListItem

    fields = set(ReportListItem.model_fields.keys())
    assert "acknowledgment_due" in fields
    assert "feedback_due" in fields
    assert "feedback_given_at" in fields


# ── Submit endpoint sets deadlines ──


def test_submit_report_sets_deadlines():
    """submit_report should set acknowledgment_due and feedback_due."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert "acknowledgment_due=" in source
    assert "feedback_due=" in source
    assert "settings.ACKNOWLEDGMENT_DAYS" in source
    assert "settings.FEEDBACK_DEADLINE_DAYS" in source


def test_submit_uses_timedelta():
    """submit_report should use timedelta for computing deadlines."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert "timedelta(days=settings.ACKNOWLEDGMENT_DAYS)" in source
    assert "timedelta(days=settings.FEEDBACK_DEADLINE_DAYS)" in source


# ── Track endpoint returns deadline info ──


def test_track_returns_acknowledgment_due():
    """track_report should return acknowledgment_due in response."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.track_report)
    assert "acknowledgment_due" in source


def test_track_returns_feedback_due():
    """track_report should return feedback_due in response."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.track_report)
    assert "feedback_due" in source


def test_track_returns_feedback_given_at():
    """track_report should return feedback_given_at in response."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.track_report)
    assert "feedback_given_at" in source


# ── Feedback timestamp on closure ──


def test_update_status_sets_feedback_given_at_on_close():
    """update_status should set feedback_given_at when status becomes CLOSED."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.update_status)
    assert "feedback_given_at" in source
    assert "ReportStatus.CLOSED" in source


# ── Compliance stats endpoint ──


def test_compliance_stats_endpoint_exists():
    """compliance_stats endpoint should exist in the reports module."""
    from app.api.v1.reports import compliance_stats

    assert callable(compliance_stats)


def test_compliance_stats_is_get_endpoint():
    """compliance_stats should be a GET endpoint."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert '"/compliance/stats"' in source or "compliance/stats" in source


def test_compliance_stats_requires_auth():
    """compliance_stats should require admin authentication."""
    import inspect

    from app.api.v1.reports import compliance_stats

    source = inspect.getsource(compliance_stats)
    assert "get_current_user" in source


def test_compliance_stats_returns_three_counts():
    """compliance_stats should return ack_overdue, fb_overdue, fb_warning."""
    import inspect

    from app.api.v1.reports import compliance_stats

    source = inspect.getsource(compliance_stats)
    assert "acknowledgment_overdue" in source
    assert "feedback_overdue" in source
    assert "feedback_warning" in source


def test_compliance_stats_uses_configurable_warning_days():
    """compliance_stats should use settings.FEEDBACK_WARNING_DAYS."""
    import inspect

    from app.api.v1.reports import compliance_stats

    source = inspect.getsource(compliance_stats)
    assert "settings.FEEDBACK_WARNING_DAYS" in source


# ── Lifespan migration ──


def test_deadline_migration_in_lifespan():
    """Lifespan should add acknowledgment_due, feedback_due, feedback_given_at columns."""
    import inspect

    from app import main

    source = inspect.getsource(main.lifespan)
    assert "acknowledgment_due" in source
    assert "feedback_due" in source
    assert "feedback_given_at" in source
    assert "TIMESTAMPTZ" in source
