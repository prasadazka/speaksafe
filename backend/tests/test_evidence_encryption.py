"""Tests for evidence file encryption (AES-256-GCM).

Tests the binary encrypt/decrypt functions, the Evidence model
encryption_iv field, the EvidenceItem schema, and the endpoint
source code to verify encryption is wired correctly.
"""

import base64
import os
from unittest.mock import patch

import pytest

# ── Test key fixture ──

_TEST_KEY = base64.urlsafe_b64encode(os.urandom(32)).decode()


@pytest.fixture(autouse=True)
def _set_encryption_key():
    """Inject a valid ENCRYPTION_KEY for all tests."""
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = _TEST_KEY
        yield mock_settings


# ── encrypt_bytes / decrypt_bytes round-trip ──


def test_encrypt_decrypt_bytes_roundtrip():
    """Encrypting then decrypting returns original bytes."""
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    data = b"confidential evidence file content \x00\xff\xfe"
    ct, nonce_b64 = encrypt_bytes(data)
    assert ct != data
    assert decrypt_bytes(ct, nonce_b64) == data


def test_encrypt_bytes_returns_nonce_b64():
    """encrypt_bytes nonce is a valid base64 string decoding to 12 bytes."""
    from app.core.encryption import encrypt_bytes

    _, nonce_b64 = encrypt_bytes(b"test")
    nonce = base64.urlsafe_b64decode(nonce_b64)
    assert len(nonce) == 12


def test_encrypt_bytes_nonce_fits_varchar24():
    """base64-encoded 12-byte nonce must fit in VARCHAR(24)."""
    from app.core.encryption import encrypt_bytes

    _, nonce_b64 = encrypt_bytes(b"x")
    # base64 of 12 bytes = ceil(12/3)*4 = 16 chars (with padding)
    assert len(nonce_b64) <= 24


def test_encrypt_bytes_produces_different_ciphertext():
    """Same input, different nonce → different ciphertext."""
    from app.core.encryption import encrypt_bytes

    data = b"same file"
    ct1, iv1 = encrypt_bytes(data)
    ct2, iv2 = encrypt_bytes(data)
    assert ct1 != ct2
    assert iv1 != iv2


def test_decrypt_bytes_with_wrong_nonce_fails():
    """Decrypting with wrong nonce must raise."""
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    ct, _ = encrypt_bytes(b"secret data")
    wrong_nonce = base64.urlsafe_b64encode(os.urandom(12)).decode()
    with pytest.raises(Exception):
        decrypt_bytes(ct, wrong_nonce)


def test_decrypt_bytes_with_wrong_key_fails():
    """Decrypting with a different key must raise."""
    from app.core.encryption import encrypt_bytes

    ct, nonce_b64 = encrypt_bytes(b"secret data")

    other_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = other_key
        from app.core.encryption import decrypt_bytes

        with pytest.raises(Exception):
            decrypt_bytes(ct, nonce_b64)


def test_encrypt_bytes_tampered_ciphertext_fails():
    """Flipping a byte in ciphertext must fail GCM auth."""
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    ct, nonce_b64 = encrypt_bytes(b"integrity test")
    tampered = bytearray(ct)
    tampered[-1] ^= 0xFF
    with pytest.raises(Exception):
        decrypt_bytes(bytes(tampered), nonce_b64)


def test_encrypt_large_file():
    """Encrypt/decrypt a 10 MB file."""
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    data = os.urandom(10 * 1024 * 1024)  # 10 MB
    ct, nonce_b64 = encrypt_bytes(data)
    assert decrypt_bytes(ct, nonce_b64) == data


def test_encrypt_empty_bytes():
    """Encrypting empty bytes should work (GCM supports 0-length)."""
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    ct, nonce_b64 = encrypt_bytes(b"")
    assert decrypt_bytes(ct, nonce_b64) == b""


# ── Evidence model: encryption_iv column ──


def test_evidence_model_has_encryption_iv():
    """Evidence model should have encryption_iv column."""
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.models.evidence import Evidence

    columns = {c.name for c in Evidence.__table__.columns}
    assert "encryption_iv" in columns


def test_evidence_model_encryption_iv_max_length():
    """encryption_iv should be VARCHAR(24)."""
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.models.evidence import Evidence

    col = Evidence.__table__.c.encryption_iv
    assert col.type.length == 24


def test_evidence_model_encryption_iv_nullable():
    """encryption_iv should be nullable (legacy files have no IV)."""
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.models.evidence import Evidence

    col = Evidence.__table__.c.encryption_iv
    assert col.nullable is True


# ── EvidenceItem schema ──


def test_evidence_schema_has_encrypted_field():
    """EvidenceItem schema should include 'encrypted' bool."""
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.schemas.evidence import EvidenceItem

    fields = set(EvidenceItem.model_fields.keys())
    assert "encrypted" in fields


# ── Endpoint source checks ──


def test_upload_endpoint_calls_encrypt_bytes():
    """upload_evidence should encrypt content before GCS upload."""
    import inspect

    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.api.v1.evidence import upload_evidence

    source = inspect.getsource(upload_evidence)
    assert "encrypt_bytes" in source
    assert "encryption_iv" in source


def test_download_endpoint_calls_decrypt_bytes():
    """download_evidence should decrypt content after GCS download."""
    import inspect

    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.api.v1.evidence import download_evidence

    source = inspect.getsource(download_evidence)
    assert "decrypt_bytes" in source
    assert "encryption_iv" in source


def test_download_handles_legacy_unencrypted():
    """download_evidence should handle files without encryption_iv."""
    import inspect

    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.api.v1.evidence import download_evidence

    source = inspect.getsource(download_evidence)
    # Should check for encryption_iv before decrypting
    assert "evidence.encryption_iv" in source


# ── Lifespan migration ──


def test_encryption_iv_migration_in_lifespan():
    """main.py lifespan should add encryption_iv column."""
    import inspect

    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

    from app.main import lifespan

    source = inspect.getsource(lifespan)
    assert "encryption_iv VARCHAR(24)" in source
