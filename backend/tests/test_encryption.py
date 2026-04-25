"""Tests for AES-256-GCM encryption module."""

import base64
import os
from unittest.mock import patch

import pytest

# Generate a valid test key (32 bytes, base64-encoded)
_TEST_KEY = base64.urlsafe_b64encode(os.urandom(32)).decode()


@pytest.fixture(autouse=True)
def _set_encryption_key():
    """Inject a valid ENCRYPTION_KEY for all tests."""
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = _TEST_KEY
        yield mock_settings


def test_encrypt_decrypt_roundtrip():
    from app.core.encryption import decrypt, encrypt

    plaintext = "This is a confidential whistleblower complaint."
    ciphertext = encrypt(plaintext)
    assert ciphertext != plaintext
    assert decrypt(ciphertext) == plaintext


def test_encrypt_produces_different_output_each_time():
    from app.core.encryption import encrypt

    text = "Same input, different nonces."
    c1 = encrypt(text)
    c2 = encrypt(text)
    assert c1 != c2  # random nonce → different ciphertext


def test_empty_string_passthrough():
    from app.core.encryption import decrypt, encrypt

    assert encrypt("") == ""
    assert decrypt("") == ""


def test_unicode_roundtrip():
    from app.core.encryption import decrypt, encrypt

    arabic = "هذا تقرير سري عن فساد مالي"
    assert decrypt(encrypt(arabic)) == arabic


def test_long_text_roundtrip():
    from app.core.encryption import decrypt, encrypt

    long_text = "A" * 100_000
    assert decrypt(encrypt(long_text)) == long_text


def test_decrypt_with_wrong_key_fails():
    from app.core.encryption import encrypt

    ciphertext = encrypt("secret data")

    other_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = other_key
        from app.core.encryption import decrypt

        with pytest.raises(Exception):
            decrypt(ciphertext)


def test_tampered_ciphertext_fails():
    from app.core.encryption import decrypt, encrypt

    ciphertext = encrypt("integrity check")
    raw = bytearray(base64.urlsafe_b64decode(ciphertext))
    raw[-1] ^= 0xFF  # flip last byte (part of GCM tag)
    tampered = base64.urlsafe_b64encode(bytes(raw)).decode()
    with pytest.raises(Exception):
        decrypt(tampered)


def test_missing_key_raises():
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = ""
        from app.core.encryption import encrypt

        with pytest.raises(RuntimeError, match="ENCRYPTION_KEY is not set"):
            encrypt("test")


def test_invalid_key_raises():
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = "not-valid-base64!!!"
        from app.core.encryption import encrypt

        with pytest.raises(RuntimeError):
            encrypt("test")


def test_wrong_length_key_raises():
    short_key = base64.urlsafe_b64encode(os.urandom(16)).decode()
    with patch("app.core.encryption.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = short_key
        from app.core.encryption import encrypt

        with pytest.raises(RuntimeError, match="32 bytes"):
            encrypt("test")
