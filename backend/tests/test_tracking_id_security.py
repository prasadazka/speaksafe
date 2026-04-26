"""Tests for tracking ID security hardening.

Verifies:
 - Uses secrets module (crypto-secure), not random
 - ID length is 8 alphanumeric chars (33^8 ≈ 1.4 trillion combos)
 - Format: SS-YYYY-XXXXXXXX
 - No ambiguous characters (I, O, L)
 - Uniqueness across many generations
 - Frontend placeholder matches new format
"""

import inspect
import json
import os
import re

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ENCRYPTION_KEY", "0" * 64)

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")


# ── Backend: secrets module usage ──


def test_uses_secrets_not_random():
    """generate_tracking_id must use secrets, not random."""
    from app.models.report import generate_tracking_id

    src = inspect.getsource(generate_tracking_id)
    assert "secrets.choice" in src
    assert "random.choices" not in src
    assert "random.choice" not in src


def test_secrets_imported():
    """report module should import secrets."""
    import app.models.report as mod

    src = inspect.getsource(mod)
    assert "import secrets" in src


def test_random_not_imported():
    """report module should NOT import random."""
    import app.models.report as mod

    src = inspect.getsource(mod)
    lines = [
        line.strip() for line in src.split("\n")
        if line.strip().startswith("import random")
        or line.strip().startswith("from random")
    ]
    assert len(lines) == 0, f"random module still imported: {lines}"


# ── Backend: ID format ──


def test_tracking_id_format():
    """Tracking ID should match SS-YYYY-XXXXXXXX (8 chars)."""
    from app.models.report import generate_tracking_id

    tid = generate_tracking_id()
    assert re.match(r"^SS-\d{4}-[A-Z0-9]{8}$", tid), f"Bad format: {tid}"


def test_tracking_id_length():
    """Code portion should be exactly 8 characters."""
    from app.models.report import generate_tracking_id

    tid = generate_tracking_id()
    code = tid.split("-", 2)[2]  # SS-2026-XXXXXXXX → XXXXXXXX
    assert len(code) == 8, f"Expected 8 chars, got {len(code)}: {code}"


def test_tracking_id_no_ambiguous_chars():
    """Tracking IDs should never contain I, O, or L."""
    from app.models.report import generate_tracking_id

    for _ in range(200):
        tid = generate_tracking_id()
        code = tid.split("-", 2)[2]
        for ch in "IOL":
            assert ch not in code, f"Ambiguous char '{ch}' found in {tid}"


def test_tracking_id_year():
    """Tracking ID should contain current year."""
    import datetime

    from app.models.report import generate_tracking_id

    tid = generate_tracking_id()
    year = str(datetime.datetime.now().year)
    assert year in tid


def test_tracking_id_prefix():
    """Tracking ID should start with SS-."""
    from app.models.report import generate_tracking_id

    tid = generate_tracking_id()
    assert tid.startswith("SS-")


# ── Backend: entropy ──


def test_alphabet_has_33_chars():
    """Alphabet should have exactly 33 characters (no I/O/L)."""
    from app.models.report import generate_tracking_id

    src = inspect.getsource(generate_tracking_id)
    match = re.search(r'alphabet\s*=\s*"([^"]+)"', src)
    assert match is not None
    alphabet = match.group(1)
    assert len(alphabet) == 33, f"Expected 33 chars, got {len(alphabet)}"
    assert "I" not in alphabet
    assert "O" not in alphabet
    assert "L" not in alphabet


def test_entropy_sufficient():
    """33^8 should give at least 1 trillion combinations."""
    combos = 33 ** 8
    assert combos > 1_000_000_000_000, (
        f"Insufficient entropy: {combos} < 1 trillion"
    )


def test_uniqueness():
    """100 generated IDs should all be unique."""
    from app.models.report import generate_tracking_id

    ids = {generate_tracking_id() for _ in range(100)}
    assert len(ids) == 100, "Duplicate tracking IDs generated"


def test_code_portion_k8():
    """Source should specify k=8 or range(8) for code generation."""
    from app.models.report import generate_tracking_id

    src = inspect.getsource(generate_tracking_id)
    assert "range(8)" in src or "k=8" in src, (
        "Code generation should use 8 characters"
    )


# ── Frontend: placeholder updated ──


def test_en_placeholder_8chars():
    """English track placeholder should have 8 X characters."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "track.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    placeholder = data["placeholder"]
    assert "XXXXXXXX" in placeholder, f"Placeholder too short: {placeholder}"
    assert "SS-" in placeholder


def test_ar_placeholder_8chars():
    """Arabic track placeholder should have 8 X characters."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "track.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    placeholder = data["placeholder"]
    assert "XXXXXXXX" in placeholder, f"Placeholder too short: {placeholder}"
    assert "SS-" in placeholder


# ── Rate limit still in place ──


def test_track_endpoint_rate_limited():
    """Track endpoint should have rate limiting."""
    import app.api.v1.reports as mod

    mod_src = inspect.getsource(mod)
    assert "RATE_REPORT_TRACK" in mod_src


def test_erasure_endpoint_rate_limited():
    """Erasure endpoint should have rate limiting."""
    import app.api.v1.reports as mod

    mod_src = inspect.getsource(mod)
    assert "RATE_ERASURE" in mod_src
