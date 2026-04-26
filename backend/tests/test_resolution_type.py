"""Tests for Task #19 — Resolution type enum.

Verifies:
 - ResolutionType enum exists with 4 values
 - Report model has resolution_type column
 - Pydantic schemas include resolution_type
 - Status update endpoint handles resolution_type
 - Lifespan migration creates enum + column
 - Frontend admin-api has ResolutionType type + updated updateReportStatus
 - Case detail page shows resolution_type badge
 - Dashboard shows resolution_type badge
 - StatusChangeDialog has resolution type selector
 - Translation keys in EN/AR
"""

import inspect
import json
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")


# ── Backend: ResolutionType enum ──


def test_resolution_type_enum_exists():
    """ResolutionType enum should exist in report model."""
    from app.models.report import ResolutionType

    assert hasattr(ResolutionType, "SUBSTANTIATED")
    assert hasattr(ResolutionType, "UNSUBSTANTIATED")
    assert hasattr(ResolutionType, "INCONCLUSIVE")
    assert hasattr(ResolutionType, "REFERRED")


def test_resolution_type_enum_values():
    """ResolutionType should have exactly 4 values."""
    from app.models.report import ResolutionType

    values = {e.value for e in ResolutionType}
    expected = {
        "SUBSTANTIATED", "UNSUBSTANTIATED",
        "INCONCLUSIVE", "REFERRED",
    }
    assert values == expected


def test_resolution_type_count():
    """Should have exactly 4 resolution types."""
    from app.models.report import ResolutionType

    assert len(ResolutionType) == 4


# ── Backend: Report model column ──


def test_report_model_has_resolution_type_column():
    """Report model should have resolution_type column."""
    from app.models.report import Report

    columns = {c.name for c in Report.__table__.columns}
    assert "resolution_type" in columns


def test_report_model_resolution_type_nullable():
    """resolution_type column should be nullable."""
    from app.models.report import Report

    col = Report.__table__.c.resolution_type
    assert col.nullable is True


# ── Backend: Schemas ──


def test_report_status_update_has_resolution_type():
    """ReportStatusUpdate should accept optional resolution_type."""
    from app.schemas.report import ReportStatusUpdate

    fields = set(ReportStatusUpdate.model_fields.keys())
    assert "resolution_type" in fields


def test_report_detail_has_resolution_type():
    """ReportDetail should include resolution_type."""
    from app.schemas.report import ReportDetail

    fields = set(ReportDetail.model_fields.keys())
    assert "resolution_type" in fields


def test_report_list_item_has_resolution_type():
    """ReportListItem should include resolution_type."""
    from app.schemas.report import ReportListItem

    fields = set(ReportListItem.model_fields.keys())
    assert "resolution_type" in fields


def test_report_public_has_resolution_type():
    """ReportPublic should include resolution_type."""
    from app.schemas.report import ReportPublic

    fields = set(ReportPublic.model_fields.keys())
    assert "resolution_type" in fields


def test_report_status_update_resolution_type_optional():
    """resolution_type should default to None in status update."""
    from app.schemas.report import ReportStatusUpdate

    field = ReportStatusUpdate.model_fields["resolution_type"]
    assert field.default is None


# ── Backend: Status update endpoint ──


def test_update_status_handles_resolution_type():
    """update_status should set resolution_type on CLOSED."""
    from app.api.v1.reports import update_status

    src = inspect.getsource(update_status)
    assert "resolution_type" in src
    assert "CLOSED" in src


def test_update_status_clears_resolution_on_reopen():
    """update_status should clear resolution_type when not CLOSED."""
    from app.api.v1.reports import update_status

    src = inspect.getsource(update_status)
    # When status is not CLOSED, resolution_type should be None
    assert "resolution_type = None" in src


def test_snapshot_report_includes_resolution_type():
    """_snapshot_report should include resolution_type."""
    from app.api.v1.reports import _snapshot_report

    src = inspect.getsource(_snapshot_report)
    assert "resolution_type" in src


def test_audit_metadata_includes_resolution_type():
    """Status update should log resolution_type in metadata."""
    from app.api.v1.reports import update_status

    src = inspect.getsource(update_status)
    assert "resolution_type" in src


# ── Backend: Track endpoint includes resolution_type ──


def test_track_report_includes_resolution_type():
    """track_report should include resolution_type in public view."""
    from app.api.v1.reports import track_report

    src = inspect.getsource(track_report)
    assert "resolution_type" in src


# ── Backend: Lifespan migration ──


def test_lifespan_creates_resolution_type_enum():
    """main.py lifespan should create resolution_type enum."""
    from app.main import lifespan

    src = inspect.getsource(lifespan)
    assert "resolution_type" in src
    assert "SUBSTANTIATED" in src


def test_lifespan_adds_resolution_type_column():
    """main.py lifespan should add resolution_type column."""
    from app.main import lifespan

    src = inspect.getsource(lifespan)
    assert "ADD COLUMN IF NOT EXISTS" in src
    # Should reference resolution_type column
    lines_with_rt = [
        line for line in src.split("\n")
        if "resolution_type" in line.lower()
    ]
    assert len(lines_with_rt) >= 2  # enum creation + column add


# ── Frontend: admin-api.ts ──


def test_frontend_has_resolution_type():
    """admin-api.ts should export ResolutionType type."""
    path = os.path.join(FRONTEND, "src", "lib", "admin-api.ts")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "ResolutionType" in content
    assert "SUBSTANTIATED" in content
    assert "UNSUBSTANTIATED" in content
    assert "INCONCLUSIVE" in content
    assert "REFERRED" in content


def test_frontend_report_list_item_has_resolution_type():
    """ReportListItem interface should include resolution_type."""
    path = os.path.join(FRONTEND, "src", "lib", "admin-api.ts")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "resolution_type: ResolutionType | null" in content


def test_frontend_update_status_accepts_resolution():
    """updateReportStatus should accept resolutionType param."""
    path = os.path.join(FRONTEND, "src", "lib", "admin-api.ts")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "resolutionType?: ResolutionType" in content


# ── Frontend: StatusChangeDialog ──


def test_status_change_dialog_has_resolution_selector():
    """StatusChangeDialog should render resolution type options."""
    path = os.path.join(
        FRONTEND, "src", "components", "admin",
        "status-change-dialog.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "resolutionType" in content
    assert "SUBSTANTIATED" in content
    assert "resolutionTypeLabel" in content
    assert "isClosing" in content


# ── Frontend: Case detail page ──


def test_case_detail_has_resolution_type_badge():
    """Case detail page should show resolution_type badge."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "cases",
        "*", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    assert len(matches) > 0
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "resolution_type" in content
    assert "resolutionType" in content


def test_case_detail_sidebar_has_resolution_type():
    """Case detail sidebar should show resolution type label."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin", "cases",
        "*", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "caseDetail.resolutionType" in content


# ── Frontend: Dashboard ──


def test_dashboard_has_resolution_type_badge():
    """Dashboard should show resolution_type badge for closed cases."""
    import glob

    pattern = os.path.join(
        FRONTEND, "src", "app", "**", "admin",
        "dashboard", "page.tsx",
    )
    matches = glob.glob(pattern, recursive=True)
    assert len(matches) > 0
    with open(matches[0], encoding="utf-8") as f:
        content = f.read()
    assert "resolution_type" in content


# ── Translation keys ──


def test_en_common_resolution_keys():
    """English common.json should have resolution section."""
    path = os.path.join(
        FRONTEND, "src", "messages", "en", "common.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    res = data.get("resolution", {})
    for key in [
        "SUBSTANTIATED", "UNSUBSTANTIATED",
        "INCONCLUSIVE", "REFERRED",
    ]:
        assert key in res, f"Missing EN resolution key: {key}"


def test_ar_common_resolution_keys():
    """Arabic common.json should have resolution section."""
    path = os.path.join(
        FRONTEND, "src", "messages", "ar", "common.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    res = data.get("resolution", {})
    for key in [
        "SUBSTANTIATED", "UNSUBSTANTIATED",
        "INCONCLUSIVE", "REFERRED",
    ]:
        assert key in res, f"Missing AR resolution key: {key}"


def test_en_admin_resolution_type_label():
    """EN admin.json statusChange should have resolutionTypeLabel."""
    path = os.path.join(
        FRONTEND, "src", "messages", "en", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    sc = data.get("statusChange", {})
    assert "resolutionTypeLabel" in sc


def test_ar_admin_resolution_type_label():
    """AR admin.json statusChange should have resolutionTypeLabel."""
    path = os.path.join(
        FRONTEND, "src", "messages", "ar", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    sc = data.get("statusChange", {})
    assert "resolutionTypeLabel" in sc


def test_en_admin_case_detail_resolution_type():
    """EN admin.json caseDetail should have resolutionType key."""
    path = os.path.join(
        FRONTEND, "src", "messages", "en", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    cd = data.get("caseDetail", {})
    assert "resolutionType" in cd


def test_ar_admin_case_detail_resolution_type():
    """AR admin.json caseDetail should have resolutionType key."""
    path = os.path.join(
        FRONTEND, "src", "messages", "ar", "admin.json",
    )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    cd = data.get("caseDetail", {})
    assert "resolutionType" in cd
