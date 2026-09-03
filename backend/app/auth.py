"""Optional Supabase JWT verification.

If SUPABASE_JWT_SECRET is unset, tokens are not verified and routes stay open
so the stub API can run before a hosted project exists.
"""

from __future__ import annotations

import os
from typing import Any, Optional

from fastapi import Header, HTTPException


def verify_supabase_jwt_optional(
    authorization: Optional[str] = Header(default=None),
) -> Optional[dict[str, Any]]:
    secret = os.getenv("SUPABASE_JWT_SECRET") or ""
    if not secret.strip():
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        import jwt
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="PyJWT is not installed") from exc
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    return payload
