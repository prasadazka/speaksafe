"""Tests for Task #18 — Reporter rights info (anti-retaliation policy).

Verifies:
 - Report form page includes rights / anti-retaliation UI elements
 - Translation keys exist in EN and AR for all rights sections
 - Collapsible component uses ChevronDown + ShieldCheck icons
"""

import json
import os

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")


# ── Report page has rights section ──


def test_report_page_has_rights_title():
    """Report page should render rights.title translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "rights.title" in content


def test_report_page_has_shield_check_icon():
    """Report page should import ShieldCheck icon for rights card."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "ShieldCheck" in content


def test_report_page_has_chevron_down_icon():
    """Report page should import ChevronDown for collapsible toggle."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "ChevronDown" in content


def test_report_page_has_ban_icon():
    """Report page should import Ban icon for no-retaliation right."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "Ban" in content


def test_report_page_has_gavel_icon():
    """Report page should import Gavel icon for legal protection."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "Gavel" in content


def test_report_page_has_rights_open_state():
    """Report page should have rightsOpen state for collapsible."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "rightsOpen" in content


def test_report_page_has_no_retaliation_key():
    """Report page should reference noRetaliation translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "noRetaliation" in content


def test_report_page_has_confidentiality_key():
    """Report page should reference confidentiality translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "confidentiality" in content


def test_report_page_has_anonymity_key():
    """Report page should reference anonymity translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "anonymity" in content


def test_report_page_has_legal_protection_key():
    """Report page should reference legalProtection translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "legalProtection" in content


def test_report_page_has_rights_legal_ref():
    """Report page should reference rights.legal translation key."""
    path = os.path.join(
        FRONTEND, "src", "app", "[locale]", "report", "page.tsx",
    )
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert "rights.legal" in content


# ── English translation keys ──


def test_en_rights_title():
    """English report.json should have rights.title key."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "title" in rights


def test_en_rights_intro():
    """English report.json should have rights.intro key."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "intro" in rights


def test_en_rights_no_retaliation():
    """English report.json should have noRetaliation with title+desc."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    nr = data.get("rights", {}).get("noRetaliation", {})
    assert "title" in nr
    assert "desc" in nr


def test_en_rights_confidentiality():
    """English report.json should have confidentiality with title+desc."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    c = data.get("rights", {}).get("confidentiality", {})
    assert "title" in c
    assert "desc" in c


def test_en_rights_anonymity():
    """English report.json should have anonymity with title+desc."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    a = data.get("rights", {}).get("anonymity", {})
    assert "title" in a
    assert "desc" in a


def test_en_rights_legal_protection():
    """English report.json should have legalProtection with title+desc."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    lp = data.get("rights", {}).get("legalProtection", {})
    assert "title" in lp
    assert "desc" in lp


def test_en_rights_legal():
    """English report.json should have rights.legal key."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "legal" in rights
    assert "2019/1937" in rights["legal"]


def test_en_rights_mentions_eu_directive():
    """English rights.legal should mention EU Directive."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    legal = data.get("rights", {}).get("legal", "")
    assert "EU Directive" in legal


def test_en_rights_mentions_gdpr():
    """English rights.legal should mention GDPR."""
    path = os.path.join(FRONTEND, "src", "messages", "en", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    legal = data.get("rights", {}).get("legal", "")
    assert "GDPR" in legal


# ── Arabic translation keys ──


def test_ar_rights_title():
    """Arabic report.json should have rights.title key."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "title" in rights


def test_ar_rights_intro():
    """Arabic report.json should have rights.intro key."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "intro" in rights


def test_ar_rights_all_sections():
    """Arabic report.json should have all 4 rights sections."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    for key in [
        "noRetaliation", "confidentiality", "anonymity", "legalProtection",
    ]:
        section = rights.get(key, {})
        assert "title" in section, f"Missing AR rights.{key}.title"
        assert "desc" in section, f"Missing AR rights.{key}.desc"


def test_ar_rights_legal():
    """Arabic report.json should have rights.legal key."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rights = data.get("rights", {})
    assert "legal" in rights
    assert "2019/1937" in rights["legal"]


def test_ar_rights_mentions_gdpr():
    """Arabic rights.legal should mention GDPR."""
    path = os.path.join(FRONTEND, "src", "messages", "ar", "report.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    legal = data.get("rights", {}).get("legal", "")
    assert "GDPR" in legal
