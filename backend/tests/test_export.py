"""Tests for Task #15 — CSV/PDF bulk export.

Verifies:
 - export_csv endpoint exists with correct signature
 - export_pdf endpoint exists with correct signature
 - _build_filtered_query helper exists and applies filters
 - _report_to_row helper maps Report fields correctly
 - _generate_pdf helper exists and returns bytes
 - _CSV_COLUMNS has expected column headers
 - CSV export uses StreamingResponse with text/csv
 - PDF export uses StreamingResponse with application/pdf
 - Both endpoints accept status/category/severity/page/limit params
 - Both endpoints log REPORT_EXPORTED audit action
 - REPORT_EXPORTED action exists in AuditAction enum
 - fpdf2 is in requirements.txt
 - Frontend admin-api has exportReportsCSV / exportReportsPDF
 - Frontend dashboard imports export functions
 - Translation keys exist for export UI
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── REPORT_EXPORTED enum value ──


def test_report_exported_in_audit_action():
    """AuditAction should have REPORT_EXPORTED."""
    from app.models.audit_log import AuditAction

    assert hasattr(AuditAction, "REPORT_EXPORTED")
    assert AuditAction.REPORT_EXPORTED.value == "REPORT_EXPORTED"


# ── _build_filtered_query helper ──


def test_build_filtered_query_exists():
    """_build_filtered_query should exist in reports module."""
    from app.api.v1.reports import _build_filtered_query

    assert callable(_build_filtered_query)


def test_build_filtered_query_applies_filters():
    """_build_filtered_query should reference status, category, severity."""
    import inspect

    from app.api.v1.reports import _build_filtered_query

    source = inspect.getsource(_build_filtered_query)
    assert "status" in source
    assert "category" in source
    assert "severity" in source
    assert "is_deleted" in source


# ── _report_to_row helper ──


def test_report_to_row_exists():
    """_report_to_row should exist."""
    from app.api.v1.reports import _report_to_row

    assert callable(_report_to_row)


def test_report_to_row_maps_fields():
    """_report_to_row should map tracking_id, category, severity, etc."""
    import inspect

    from app.api.v1.reports import _report_to_row

    source = inspect.getsource(_report_to_row)
    assert "tracking_id" in source
    assert "category" in source
    assert "severity" in source
    assert "status" in source
    assert "location" in source
    assert "evidence_count" in source
    assert "notes_count" in source


# ── _CSV_COLUMNS ──


def test_csv_columns_exist():
    """_CSV_COLUMNS should be defined with expected headers."""
    from app.api.v1.reports import _CSV_COLUMNS

    assert isinstance(_CSV_COLUMNS, list)
    assert "Tracking ID" in _CSV_COLUMNS
    assert "Category" in _CSV_COLUMNS
    assert "Severity" in _CSV_COLUMNS
    assert "Status" in _CSV_COLUMNS
    assert len(_CSV_COLUMNS) >= 10


# ── _generate_pdf helper ──


def test_generate_pdf_exists():
    """_generate_pdf should exist and be callable."""
    from app.api.v1.reports import _generate_pdf

    assert callable(_generate_pdf)


def test_generate_pdf_returns_bytes():
    """_generate_pdf should return bytes (PDF content)."""
    from app.api.v1.reports import _generate_pdf

    result = _generate_pdf([], {})
    assert isinstance(result, bytes)
    assert result[:5] == b"%PDF-"


# ── export_csv endpoint ──


def test_export_csv_exists():
    """export_csv endpoint should exist."""
    from app.api.v1.reports import export_csv

    assert callable(export_csv)


def test_export_csv_accepts_filters():
    """export_csv should accept status, category, severity params."""
    import inspect

    from app.api.v1.reports import export_csv

    sig = inspect.signature(export_csv)
    params = list(sig.parameters.keys())
    assert "status" in params
    assert "category" in params
    assert "severity" in params


def test_export_csv_accepts_pagination():
    """export_csv should accept page and limit params."""
    import inspect

    from app.api.v1.reports import export_csv

    sig = inspect.signature(export_csv)
    params = list(sig.parameters.keys())
    assert "page" in params
    assert "limit" in params


def test_export_csv_uses_streaming_response():
    """export_csv should use StreamingResponse."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.export_csv)
    assert "StreamingResponse" in source
    assert "text/csv" in source


def test_export_csv_logs_audit():
    """export_csv should log REPORT_EXPORTED audit action."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.export_csv)
    assert "REPORT_EXPORTED" in source
    assert "log_action" in source


# ── export_pdf endpoint ──


def test_export_pdf_exists():
    """export_pdf endpoint should exist."""
    from app.api.v1.reports import export_pdf

    assert callable(export_pdf)


def test_export_pdf_accepts_filters():
    """export_pdf should accept status, category, severity params."""
    import inspect

    from app.api.v1.reports import export_pdf

    sig = inspect.signature(export_pdf)
    params = list(sig.parameters.keys())
    assert "status" in params
    assert "category" in params
    assert "severity" in params


def test_export_pdf_accepts_pagination():
    """export_pdf should accept page and limit params."""
    import inspect

    from app.api.v1.reports import export_pdf

    sig = inspect.signature(export_pdf)
    params = list(sig.parameters.keys())
    assert "page" in params
    assert "limit" in params


def test_export_pdf_uses_streaming_response():
    """export_pdf should use StreamingResponse for PDF."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.export_pdf)
    assert "StreamingResponse" in source
    assert "application/pdf" in source


def test_export_pdf_logs_audit():
    """export_pdf should log REPORT_EXPORTED audit action."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports.export_pdf)
    assert "REPORT_EXPORTED" in source
    assert "log_action" in source


# ── fpdf2 in requirements ──


def test_fpdf2_in_requirements():
    """fpdf2 should be in requirements.txt."""
    import pathlib

    req = (
        pathlib.Path(__file__).parent.parent / "requirements.txt"
    )
    content = req.read_text()
    assert "fpdf2" in content


# ── Frontend integration ──


def test_frontend_admin_api_has_export_csv():
    """admin-api.ts should export exportReportsCSV function."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend" / "src" / "lib" / "admin-api.ts"
    )
    content = api_file.read_text(encoding="utf-8")
    assert "exportReportsCSV" in content
    assert "export/csv" in content


def test_frontend_admin_api_has_export_pdf():
    """admin-api.ts should export exportReportsPDF function."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend" / "src" / "lib" / "admin-api.ts"
    )
    content = api_file.read_text(encoding="utf-8")
    assert "exportReportsPDF" in content
    assert "export/pdf" in content


def test_frontend_admin_api_has_export_filters():
    """admin-api.ts should have ExportFilters interface."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend" / "src" / "lib" / "admin-api.ts"
    )
    content = api_file.read_text(encoding="utf-8")
    assert "ExportFilters" in content


def test_frontend_dashboard_imports_export():
    """Dashboard page should import export functions."""
    import pathlib

    page = list(
        pathlib.Path(__file__).parent.parent.parent.glob(
            "frontend/src/app/**/admin/dashboard/page.tsx"
        )
    )
    assert len(page) > 0
    content = page[0].read_text(encoding="utf-8")
    assert "exportReportsCSV" in content
    assert "exportReportsPDF" in content
    assert "Download" in content


def test_frontend_dashboard_has_export_button():
    """Dashboard page should have export dropdown UI."""
    import pathlib

    page = list(
        pathlib.Path(__file__).parent.parent.parent.glob(
            "frontend/src/app/**/admin/dashboard/page.tsx"
        )
    )
    assert len(page) > 0
    content = page[0].read_text(encoding="utf-8")
    assert "handleExport" in content
    assert "showExportMenu" in content


def test_translation_en_has_export_keys():
    """English translations should have export label/csv/pdf keys."""
    import json
    import pathlib

    en = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend" / "src" / "messages" / "en" / "admin.json"
    )
    data = json.loads(en.read_text(encoding="utf-8"))
    export = data["dashboard"]["export"]
    assert "label" in export
    assert "csv" in export
    assert "pdf" in export


def test_translation_ar_has_export_keys():
    """Arabic translations should have export label/csv/pdf keys."""
    import json
    import pathlib

    ar = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend" / "src" / "messages" / "ar" / "admin.json"
    )
    data = json.loads(ar.read_text(encoding="utf-8"))
    export = data["dashboard"]["export"]
    assert "label" in export
    assert "csv" in export
    assert "pdf" in export
