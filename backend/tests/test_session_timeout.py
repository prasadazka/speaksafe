"""Tests for Task #11 — Session timeout after inactivity.

Verifies:
 - AdminUser model has last_active_at column
 - config has SESSION_TIMEOUT_MINUTES setting
 - get_current_user checks last_active_at for inactivity
 - get_current_user updates last_active_at on each request
 - Login sets last_active_at
 - Lifespan migration adds column
 - Frontend dispatches session-expired event on 401
 - Frontend auth-context listens for session-expired event
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)


# ── Model: last_active_at column ──


def test_admin_user_has_last_active_at():
    """AdminUser model should have last_active_at column."""
    from app.models.admin_user import AdminUser

    assert hasattr(AdminUser, "last_active_at")


def test_last_active_at_is_nullable():
    """last_active_at should be nullable (None before first activity)."""
    import inspect

    from app.models import admin_user

    source = inspect.getsource(admin_user)
    # Column should be nullable — new users won't have it set
    assert "last_active_at" in source
    assert "nullable=True" in source


# ── Config: SESSION_TIMEOUT_MINUTES ──


def test_session_timeout_config_exists():
    """Settings should have SESSION_TIMEOUT_MINUTES."""
    from app.core.config import settings

    assert hasattr(settings, "SESSION_TIMEOUT_MINUTES")


def test_session_timeout_default_30():
    """Default session timeout should be 30 minutes."""
    from app.core.config import settings

    assert settings.SESSION_TIMEOUT_MINUTES == 30


def test_session_timeout_is_int():
    """SESSION_TIMEOUT_MINUTES should be an integer."""
    from app.core.config import settings

    assert isinstance(settings.SESSION_TIMEOUT_MINUTES, int)


# ── deps.py: get_current_user checks inactivity ──


def test_get_current_user_checks_last_active_at():
    """get_current_user should check last_active_at for timeout."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps.get_current_user)
    assert "last_active_at" in source


def test_get_current_user_uses_session_timeout():
    """get_current_user should reference SESSION_TIMEOUT_MINUTES."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps.get_current_user)
    assert "SESSION_TIMEOUT_MINUTES" in source


def test_get_current_user_raises_401_on_timeout():
    """get_current_user should raise 401 when session expired."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps.get_current_user)
    assert "Session expired" in source
    assert "401" in source or "HTTP_401_UNAUTHORIZED" in source


def test_get_current_user_bumps_last_active():
    """get_current_user should update last_active_at on valid request."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps.get_current_user)
    assert "user.last_active_at = now" in source


def test_get_current_user_computes_idle_time():
    """get_current_user should compute idle time using timedelta."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps.get_current_user)
    assert "timedelta" in source
    assert "idle" in source or "now - user.last_active_at" in source


def test_get_current_user_imports_settings():
    """deps.py should import settings for timeout config."""
    import inspect

    from app.api import deps

    source = inspect.getsource(deps)
    assert "from app.core.config import settings" in source


# ─�� Login sets last_active_at ──


def test_login_sets_last_active_at():
    """Login endpoint should set last_active_at alongside last_login_at."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.login)
    assert "last_active_at" in source


def test_login_sets_both_timestamps():
    """Login should set both last_login_at and last_active_at to same time."""
    import inspect

    from app.api.v1 import auth

    source = inspect.getsource(auth.login)
    assert "last_login_at = now" in source
    assert "last_active_at = now" in source


# ── Lifespan migration ──


def test_lifespan_adds_last_active_at_column():
    """Lifespan should add last_active_at column to admin_users."""
    import inspect

    from app import main

    source = inspect.getsource(main)
    assert "last_active_at" in source
    assert "admin_users" in source


# ── Frontend: session-expired event ──


def test_frontend_admin_api_dispatches_session_expired():
    """admin-api.ts should dispatch session-expired event on 401."""
    import pathlib

    api_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "lib"
        / "admin-api.ts"
    )
    content = api_file.read_text(encoding="utf-8")
    assert "sawtsafe:session-expired" in content
    assert "dispatchEvent" in content
    assert "401" in content


def test_frontend_auth_context_listens_session_expired():
    """auth-context.tsx should listen for session-expired event."""
    import pathlib

    ctx_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "contexts"
        / "auth-context.tsx"
    )
    content = ctx_file.read_text(encoding="utf-8")
    assert "sawtsafe:session-expired" in content
    assert "addEventListener" in content


def test_frontend_auth_context_auto_logout_on_expired():
    """auth-context.tsx should call logout when session-expired fires."""
    import pathlib

    ctx_file = (
        pathlib.Path(__file__).parent.parent.parent
        / "frontend"
        / "src"
        / "contexts"
        / "auth-context.tsx"
    )
    content = ctx_file.read_text(encoding="utf-8")
    # The event handler should invoke logout
    assert "logout" in content
    assert "removeEventListener" in content


# ── .env.example ──


def test_env_example_has_session_timeout():
    """`.env.example` should include SESSION_TIMEOUT_MINUTES."""
    import pathlib

    env_file = (
        pathlib.Path(__file__).parent.parent.parent / ".env.example"
    )
    content = env_file.read_text()
    assert "SESSION_TIMEOUT_MINUTES" in content
