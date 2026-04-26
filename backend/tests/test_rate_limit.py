"""Tests for rate limiting configuration.

Verifies the rate limiter module, rate constants, IP extraction,
and that the correct decorators are applied to public endpoints.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Rate limit constants ──


def test_rate_login_format():
    """Login rate should be a valid slowapi rate string."""
    from app.core.rate_limit import RATE_LOGIN

    assert "/" in RATE_LOGIN
    count, period = RATE_LOGIN.split("/")
    assert int(count) > 0
    assert period in ("second", "minute", "hour", "day")


def test_rate_register_format():
    """Register rate should be a valid slowapi rate string."""
    from app.core.rate_limit import RATE_REGISTER

    assert "/" in RATE_REGISTER
    count, period = RATE_REGISTER.split("/")
    assert int(count) > 0
    assert period in ("second", "minute", "hour", "day")


def test_rate_report_submit_format():
    """Report submit rate should be a valid slowapi rate string."""
    from app.core.rate_limit import RATE_REPORT_SUBMIT

    assert "/" in RATE_REPORT_SUBMIT
    count, period = RATE_REPORT_SUBMIT.split("/")
    assert int(count) > 0
    assert period in ("second", "minute", "hour", "day")


def test_rate_report_track_format():
    """Report track rate should be a valid slowapi rate string."""
    from app.core.rate_limit import RATE_REPORT_TRACK

    assert "/" in RATE_REPORT_TRACK
    count, period = RATE_REPORT_TRACK.split("/")
    assert int(count) > 0
    assert period in ("second", "minute", "hour", "day")


def test_rate_evidence_upload_format():
    """Evidence upload rate should be a valid slowapi rate string."""
    from app.core.rate_limit import RATE_EVIDENCE_UPLOAD

    assert "/" in RATE_EVIDENCE_UPLOAD
    count, period = RATE_EVIDENCE_UPLOAD.split("/")
    assert int(count) > 0
    assert period in ("second", "minute", "hour", "day")


def test_login_stricter_than_track():
    """Login should have stricter rate limit than track."""
    from app.core.rate_limit import RATE_LOGIN, RATE_REPORT_TRACK

    login_count = int(RATE_LOGIN.split("/")[0])
    track_count = int(RATE_REPORT_TRACK.split("/")[0])
    assert login_count < track_count


# ── Limiter instance ──


def test_limiter_is_slowapi_instance():
    """limiter should be a slowapi Limiter."""
    from slowapi import Limiter

    from app.core.rate_limit import limiter

    assert isinstance(limiter, Limiter)


# ── IP extraction ──


def test_get_client_ip_from_forwarded():
    """Should extract first IP from X-Forwarded-For."""
    from unittest.mock import MagicMock

    from app.core.rate_limit import _get_client_ip

    request = MagicMock()
    request.headers = {"x-forwarded-for": "1.2.3.4, 10.0.0.1"}
    request.client = MagicMock()
    request.client.host = "127.0.0.1"

    assert _get_client_ip(request) == "1.2.3.4"


def test_get_client_ip_fallback():
    """Should fall back to request.client.host when no forwarded header."""
    from unittest.mock import MagicMock

    from app.core.rate_limit import _get_client_ip

    request = MagicMock()
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "192.168.1.1"
    request.scope = {"type": "http"}

    ip = _get_client_ip(request)
    # Should not be None — either from client or from get_remote_address
    assert ip is not None


# ── Decorator presence checks (source inspection) ──


def test_login_endpoint_has_rate_limit():
    """login endpoint should have @limiter.limit decorator."""
    import inspect

    from app.api.v1 import auth

    module_source = inspect.getsource(auth)
    assert "limiter.limit(RATE_LOGIN)" in module_source


def test_register_endpoint_has_rate_limit():
    """register endpoint should have @limiter.limit decorator."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth)
    assert "limiter.limit(RATE_REGISTER)" in source


def test_submit_report_endpoint_has_rate_limit():
    """submit_report should have @limiter.limit decorator."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert "limiter.limit(RATE_REPORT_SUBMIT)" in source


def test_track_report_endpoint_has_rate_limit():
    """track_report should have @limiter.limit decorator."""
    import inspect

    from app.api.v1 import reports

    source = inspect.getsource(reports)
    assert "limiter.limit(RATE_REPORT_TRACK)" in source


def test_upload_evidence_endpoint_has_rate_limit():
    """upload_evidence should have @limiter.limit decorator."""
    import inspect

    from app.api.v1 import evidence

    source = inspect.getsource(evidence)
    assert "limiter.limit(RATE_EVIDENCE_UPLOAD)" in source


# ── App-level integration ──


def test_app_has_limiter_state():
    """FastAPI app.state should have limiter attached."""
    from app.main import app

    assert hasattr(app.state, "limiter")


def test_app_has_rate_limit_exception_handler():
    """App should handle RateLimitExceeded with 429 JSON response."""
    from slowapi.errors import RateLimitExceeded

    from app.main import app

    # Check that the exception handler is registered
    handlers = app.exception_handlers
    assert RateLimitExceeded in handlers


def test_rate_limit_response_format():
    """429 response should follow ApiResponse envelope format."""
    from unittest.mock import MagicMock

    from app.main import _rate_limit_handler

    request = MagicMock()
    exc = MagicMock()
    exc.detail = "5 per 1 minute"

    response = _rate_limit_handler(request, exc)
    assert response.status_code == 429

    import json

    body = json.loads(response.body)
    assert body["success"] is False
    assert body["data"] is None
    assert "Rate limit exceeded" in body["error"]
    assert body["meta"] is None
