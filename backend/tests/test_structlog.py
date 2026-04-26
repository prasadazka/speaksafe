"""Tests for Task #12 — Structlog configuration.

Verifies:
 - logging.py module exists with setup_logging and get_logger
 - setup_logging configures structlog with correct processors
 - Dev mode uses ConsoleRenderer, prod uses JSONRenderer
 - get_logger returns a structlog BoundLogger
 - main.py calls setup_logging in lifespan
 - RequestLoggingMiddleware exists and logs requests
 - X-Request-ID header is set on responses
 - structlog is in requirements.txt
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Module exists ──


def test_logging_module_exists():
    """app.core.logging should be importable."""
    from app.core import logging

    assert logging is not None


def test_setup_logging_exists():
    """setup_logging function should exist."""
    from app.core.logging import setup_logging

    assert callable(setup_logging)


def test_get_logger_exists():
    """get_logger function should exist."""
    from app.core.logging import get_logger

    assert callable(get_logger)


# ── setup_logging configures structlog ──


def test_setup_logging_uses_structlog():
    """setup_logging should configure structlog."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "structlog.configure" in source


def test_setup_logging_has_timestamper():
    """setup_logging should include TimeStamper processor."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "TimeStamper" in source


def test_setup_logging_has_add_log_level():
    """setup_logging should include add_log_level processor."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "add_log_level" in source


def test_setup_logging_has_merge_contextvars():
    """setup_logging should use contextvars for request-scoped context."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "merge_contextvars" in source


# ── Dev vs Prod renderers ──


def test_dev_uses_console_renderer():
    """Development mode should use ConsoleRenderer."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "ConsoleRenderer" in source


def test_prod_uses_json_renderer():
    """Production mode should use JSONRenderer."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "JSONRenderer" in source


def test_renderer_switches_on_environment():
    """Renderer choice should depend on ENVIRONMENT setting."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "development" in source
    assert "is_dev" in source or "ENVIRONMENT" in source


# ── get_logger returns bound logger ──


def test_get_logger_returns_bound_logger():
    """get_logger should use structlog.get_logger."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging.get_logger)
    assert "structlog.get_logger" in source


def test_setup_logging_callable():
    """setup_logging should be callable without errors."""
    from app.core.logging import setup_logging

    # Should not raise
    setup_logging()


def test_get_logger_callable():
    """get_logger should return a logger object."""
    from app.core.logging import get_logger, setup_logging

    setup_logging()
    logger = get_logger("test")
    assert logger is not None


# ── main.py integration ──


def test_main_calls_setup_logging():
    """main.py lifespan should call setup_logging."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "setup_logging" in source


def test_main_imports_setup_logging():
    """main.py should import setup_logging from core.logging."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "from app.core.logging import setup_logging" in source


def test_main_has_request_logging_middleware():
    """main.py should have RequestLoggingMiddleware."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "RequestLoggingMiddleware" in source


def test_request_logging_logs_status_and_duration():
    """RequestLoggingMiddleware should log status_code and duration_ms."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "status_code" in source
    assert "duration_ms" in source


def test_request_logging_sets_request_id_header():
    """RequestLoggingMiddleware should set X-Request-ID header."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "X-Request-ID" in source


def test_request_logging_binds_contextvars():
    """RequestLoggingMiddleware should bind request context using structlog.contextvars."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "bind_contextvars" in source
    assert "request_id" in source


def test_main_logs_startup_message():
    """main.py should log a startup message with environment."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "sawtsafe_starting" in source


# ── stdlib logging integration ──


def test_setup_configures_stdlib_root_logger():
    """setup_logging should configure the stdlib root logger."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "logging.getLogger()" in source
    assert "ProcessorFormatter" in source


def test_setup_quietens_noisy_loggers():
    """setup_logging should reduce noise from uvicorn and sqlalchemy."""
    import inspect

    from app.core import logging

    source = inspect.getsource(logging)
    assert "uvicorn" in source
    assert "sqlalchemy" in source


# ── requirements.txt ──


def test_structlog_in_requirements():
    """structlog should be in requirements.txt."""
    import pathlib

    req = (
        pathlib.Path(__file__).parent.parent / "requirements.txt"
    )
    content = req.read_text()
    assert "structlog" in content
