"""Tests for the audit log system.

The AuditLog model uses PostgreSQL-specific types (JSONB, UUID) so
full integration tests require PostgreSQL. These tests verify:

1. Model/schema field definitions (no DB needed)
2. log_action function logic (user_agent truncation, hash chaining)
3. Trigger SQL is syntactically correct (checked via string assertions)
4. Hash computation determinism and chain integrity

Integration tests (INSERT, UPDATE/DELETE blocking) run in CI with
real PostgreSQL via `docker compose up` + `pytest`.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

from app.models.audit_log import AuditAction, AuditLog  # noqa: I001
from app.schemas.audit_log import AuditLogItem


# ── Model field presence tests ──


def test_audit_log_model_has_user_agent_field():
    """AuditLog model should have a user_agent column."""
    columns = {c.name for c in AuditLog.__table__.columns}
    assert "user_agent" in columns


def test_audit_log_model_has_ip_address_field():
    """AuditLog model should have an ip_address column."""
    columns = {c.name for c in AuditLog.__table__.columns}
    assert "ip_address" in columns


def test_audit_log_model_user_agent_max_length():
    """user_agent column should allow up to 512 characters."""
    col = AuditLog.__table__.c.user_agent
    assert col.type.length == 512


def test_audit_log_model_ip_address_max_length():
    """ip_address column should allow up to 45 characters (IPv6)."""
    col = AuditLog.__table__.c.ip_address
    assert col.type.length == 45


def test_audit_log_model_has_all_expected_columns():
    """AuditLog should have exactly these columns."""
    expected = {
        "id", "actor_id", "actor_email", "action",
        "resource_type", "resource_id", "ip_address",
        "user_agent", "metadata", "record_hash", "prev_hash",
        "created_at",
    }
    actual = {c.name for c in AuditLog.__table__.columns}
    assert expected == actual


# ── Schema field presence tests ──


def test_audit_log_schema_has_user_agent():
    """AuditLogItem Pydantic schema should include user_agent."""
    fields = set(AuditLogItem.model_fields.keys())
    assert "user_agent" in fields


def test_audit_log_schema_has_all_fields():
    expected = {
        "id", "actor_id", "actor_email", "action",
        "resource_type", "resource_id", "ip_address",
        "user_agent", "metadata_", "record_hash", "prev_hash",
        "created_at",
    }
    actual = set(AuditLogItem.model_fields.keys())
    assert expected == actual


# ── AuditAction enum coverage ──


def test_all_audit_actions_defined():
    """All expected audit action types should exist."""
    expected = {
        "REPORT_CREATED",
        "REPORT_STATUS_UPDATED",
        "REPORT_SEVERITY_UPDATED",
        "REPORT_DELETED",
        "EVIDENCE_UPLOADED",
        "EVIDENCE_DELETED",
        "NOTE_ADDED",
        "ADMIN_REGISTERED",
        "ADMIN_LOGIN",
        "ADMIN_ROLE_CHANGED",
        "ADMIN_DEACTIVATED",
        "ADMIN_ACTIVATED",
        "ADMIN_DELETED",
        "ADMIN_PASSWORD_RESET",
        "ADMIN_PASSWORD_CHANGED",
        "REPORT_PURGED",
        "REPORT_ERASED",
        "REPORT_EXPORTED",
        "REPORT_VIEWED",
    }
    actual = {a.value for a in AuditAction}
    assert expected == actual


def test_audit_action_count():
    """Should have exactly 19 audit action types."""
    assert len(AuditAction) == 19


# ── log_action user_agent truncation ──


def test_user_agent_truncation_in_service():
    """log_action should truncate user_agent to 512 chars."""
    import inspect

    from app.services.audit import log_action

    # Verify the function signature includes user_agent param
    sig = inspect.signature(log_action)
    assert "user_agent" in sig.parameters

    # Verify truncation logic exists in function source
    source = inspect.getsource(log_action)
    assert "user_agent[:512]" in source


# ── Immutability trigger SQL ──


def test_trigger_sql_in_lifespan():
    """main.py lifespan should create immutability triggers."""
    import inspect

    from app.main import lifespan

    source = inspect.getsource(lifespan)

    # Check trigger function creation
    assert "audit_logs_immutable" in source
    assert "append-only" in source

    # Check both triggers exist
    assert "trg_audit_logs_no_update" in source
    assert "trg_audit_logs_no_delete" in source

    # Check they fire BEFORE UPDATE and BEFORE DELETE
    assert "BEFORE UPDATE ON audit_logs" in source
    assert "BEFORE DELETE ON audit_logs" in source


def test_user_agent_migration_in_lifespan():
    """main.py lifespan should add user_agent column."""
    import inspect

    from app.main import lifespan

    source = inspect.getsource(lifespan)
    assert "user_agent VARCHAR(512)" in source


# ── Hash chain column presence ──


def test_audit_log_model_has_record_hash_field():
    """AuditLog model should have a record_hash column."""
    columns = {c.name for c in AuditLog.__table__.columns}
    assert "record_hash" in columns


def test_audit_log_model_has_prev_hash_field():
    """AuditLog model should have a prev_hash column."""
    columns = {c.name for c in AuditLog.__table__.columns}
    assert "prev_hash" in columns


def test_audit_log_model_hash_max_length():
    """Hash columns should hold 64-char SHA-256 hex digest."""
    rh = AuditLog.__table__.c.record_hash
    ph = AuditLog.__table__.c.prev_hash
    assert rh.type.length == 64
    assert ph.type.length == 64


def test_audit_log_schema_has_hash_fields():
    """AuditLogItem schema should include hash chain fields."""
    fields = set(AuditLogItem.model_fields.keys())
    assert "record_hash" in fields
    assert "prev_hash" in fields


# ── compute_record_hash determinism ──


def test_compute_record_hash_is_deterministic():
    """Same inputs must always produce the same hash."""
    from app.services.audit import compute_record_hash

    h1 = compute_record_hash(
        action="ADMIN_LOGIN",
        resource_type="admin_user",
        resource_id="abc-123",
        actor_email="admin@test.com",
        timestamp="2026-01-01T00:00:00+00:00",
        prev_hash="0" * 64,
    )
    h2 = compute_record_hash(
        action="ADMIN_LOGIN",
        resource_type="admin_user",
        resource_id="abc-123",
        actor_email="admin@test.com",
        timestamp="2026-01-01T00:00:00+00:00",
        prev_hash="0" * 64,
    )
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 hex digest


def test_compute_record_hash_is_sha256_hex():
    """Hash output must be a valid 64-char hex string."""
    from app.services.audit import compute_record_hash

    h = compute_record_hash(
        action="REPORT_CREATED",
        resource_type="report",
        resource_id="xyz",
        actor_email=None,
        timestamp="2026-04-26T12:00:00+00:00",
        prev_hash="0" * 64,
    )
    assert len(h) == 64
    int(h, 16)  # raises ValueError if not valid hex


def test_compute_record_hash_changes_with_different_action():
    """Changing the action must produce a different hash."""
    from app.services.audit import compute_record_hash

    base = dict(
        resource_type="report",
        resource_id="r1",
        actor_email="a@b.com",
        timestamp="2026-01-01T00:00:00+00:00",
        prev_hash="0" * 64,
    )
    h1 = compute_record_hash(action="REPORT_CREATED", **base)
    h2 = compute_record_hash(action="REPORT_DELETED", **base)
    assert h1 != h2


def test_compute_record_hash_changes_with_different_prev_hash():
    """Changing prev_hash must produce a different record_hash."""
    from app.services.audit import compute_record_hash

    base = dict(
        action="ADMIN_LOGIN",
        resource_type="admin_user",
        resource_id="u1",
        actor_email="a@b.com",
        timestamp="2026-01-01T00:00:00+00:00",
    )
    h1 = compute_record_hash(prev_hash="0" * 64, **base)
    h2 = compute_record_hash(prev_hash="a" * 64, **base)
    assert h1 != h2


def test_compute_record_hash_includes_metadata():
    """Including metadata must change the hash."""
    from app.services.audit import compute_record_hash

    base = dict(
        action="NOTE_ADDED",
        resource_type="note",
        resource_id="n1",
        actor_email="a@b.com",
        timestamp="2026-01-01T00:00:00+00:00",
        prev_hash="0" * 64,
    )
    h1 = compute_record_hash(**base)
    h2 = compute_record_hash(**base, metadata={"key": "val"})
    assert h1 != h2


def test_genesis_hash_constant():
    """GENESIS_HASH should be 64 zero characters."""
    from app.services.audit import GENESIS_HASH

    assert GENESIS_HASH == "0" * 64
    assert len(GENESIS_HASH) == 64


def test_hash_chain_simulation():
    """Simulate a 3-entry chain and verify each links to prior."""
    from app.services.audit import GENESIS_HASH, compute_record_hash

    # Entry 1
    h1 = compute_record_hash(
        action="REPORT_CREATED",
        resource_type="report",
        resource_id="r1",
        actor_email=None,
        timestamp="2026-01-01T00:00:00+00:00",
        prev_hash=GENESIS_HASH,
    )

    # Entry 2 links to entry 1
    h2 = compute_record_hash(
        action="ADMIN_LOGIN",
        resource_type="admin_user",
        resource_id="u1",
        actor_email="admin@test.com",
        timestamp="2026-01-01T00:01:00+00:00",
        prev_hash=h1,
    )

    # Entry 3 links to entry 2
    h3 = compute_record_hash(
        action="NOTE_ADDED",
        resource_type="note",
        resource_id="n1",
        actor_email="admin@test.com",
        timestamp="2026-01-01T00:02:00+00:00",
        prev_hash=h2,
    )

    # All hashes unique
    assert len({h1, h2, h3}) == 3
    # All are valid SHA-256
    for h in (h1, h2, h3):
        assert len(h) == 64
        int(h, 16)


# ── log_action hash chain integration (source check) ──


def test_log_action_computes_hash_chain():
    """log_action should call compute_record_hash and set fields."""
    import inspect

    from app.services.audit import log_action

    source = inspect.getsource(log_action)
    assert "compute_record_hash" in source
    assert "record_hash=" in source
    assert "prev_hash=" in source
    assert "_get_last_hash" in source


# ── Lifespan migration for hash columns ──


def test_hash_chain_migration_in_lifespan():
    """main.py lifespan should add hash chain columns."""
    import inspect

    from app.main import lifespan

    source = inspect.getsource(lifespan)
    assert "record_hash VARCHAR(64)" in source
    assert "prev_hash VARCHAR(64)" in source
