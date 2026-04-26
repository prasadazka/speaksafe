"""Rate limiting configuration using slowapi.

Provides a shared Limiter instance and a key function that
extracts client IP from X-Forwarded-For (Cloud Run proxy) or
falls back to request.client.host.

Rate limits by endpoint:
  - Login:           5/minute  (brute-force protection)
  - Register:        3/minute  (account creation abuse)
  - Report submit:   10/minute (spam protection)
  - Report track:    20/minute (enumeration protection)
  - Evidence upload:  5/minute  (storage abuse)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _get_client_ip(request: Request) -> str:
    """Extract real client IP behind Cloud Run / load balancer."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_get_client_ip)

# Named rate strings for each endpoint category
RATE_LOGIN = "5/minute"
RATE_REGISTER = "3/minute"
RATE_REPORT_SUBMIT = "10/minute"
RATE_REPORT_TRACK = "20/minute"
RATE_EVIDENCE_UPLOAD = "5/minute"
RATE_ERASURE = "3/minute"
