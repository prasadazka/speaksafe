"""AES-256-GCM field-level encryption for sensitive data.

Usage:
    from app.core.encryption import encrypt, decrypt

    ciphertext = encrypt("sensitive complaint text")
    plaintext  = decrypt(ciphertext)

Storage format: base64(nonce + ciphertext + tag)
  - nonce:      12 bytes (GCM standard)
  - ciphertext: variable length
  - tag:        16 bytes (GCM authentication tag, appended by AESGCM)
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_KEY_BYTES = 32  # AES-256
_NONCE_BYTES = 12  # GCM standard


def _get_key() -> bytes:
    """Derive the AES-256 key from the configured ENCRYPTION_KEY."""
    raw = settings.ENCRYPTION_KEY
    if not raw:
        raise RuntimeError(
            "ENCRYPTION_KEY is not set. Generate one with: "
            "python -c \"import os,base64; "
            "print(base64.urlsafe_b64encode(os.urandom(32))"
            ".decode())\""
        )
    try:
        key = base64.urlsafe_b64decode(raw)
    except Exception as exc:
        raise RuntimeError(
            "ENCRYPTION_KEY must be a valid base64-encoded 32-byte key."
        ) from exc
    if len(key) != _KEY_BYTES:
        raise RuntimeError(
            f"ENCRYPTION_KEY must decode to exactly {_KEY_BYTES} bytes, got {len(key)}."
        )
    return key


def encrypt(plaintext: str) -> str:
    """Encrypt a string with AES-256-GCM. Returns base64-encoded ciphertext."""
    if not plaintext:
        return plaintext
    key = _get_key()
    nonce = os.urandom(_NONCE_BYTES)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # ct already includes the 16-byte GCM tag appended by AESGCM
    return base64.urlsafe_b64encode(nonce + ct).decode("ascii")


def decrypt(ciphertext: str) -> str:
    """Decrypt a base64-encoded AES-256-GCM ciphertext back to plaintext."""
    if not ciphertext:
        return ciphertext
    key = _get_key()
    raw = base64.urlsafe_b64decode(ciphertext)
    nonce = raw[:_NONCE_BYTES]
    ct = raw[_NONCE_BYTES:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")


# ── Binary (file) encryption ──


def encrypt_bytes(data: bytes) -> tuple[bytes, str]:
    """Encrypt raw bytes with AES-256-GCM.

    Returns:
        (ciphertext_with_tag, nonce_b64):
          - ciphertext_with_tag: encrypted bytes (includes 16-byte GCM tag)
          - nonce_b64: base64-encoded 12-byte nonce (store as encryption_iv)
    """
    key = _get_key()
    nonce = os.urandom(_NONCE_BYTES)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, data, None)
    nonce_b64 = base64.urlsafe_b64encode(nonce).decode("ascii")
    return ct, nonce_b64


def decrypt_bytes(ct: bytes, nonce_b64: str) -> bytes:
    """Decrypt AES-256-GCM encrypted bytes using stored nonce.

    Args:
        ct: ciphertext with GCM tag appended
        nonce_b64: base64-encoded 12-byte nonce (from encryption_iv)
    """
    key = _get_key()
    nonce = base64.urlsafe_b64decode(nonce_b64)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None)
