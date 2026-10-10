"""Token verification: the token is sent to Supabase Auth (/auth/v1/user), which checks signature,
expiry and revocation. We never just decode a JWT and trust it."""
from dataclasses import dataclass
import httpx
from fastapi import Header, HTTPException
from .config import settings


@dataclass
class User:
    id: str
    email: str | None
    token: str


def get_current_user(authorization: str | None = Header(default=None)) -> User:
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(503, "Server is missing SUPABASE_URL / SUPABASE_ANON_KEY. See docs/SETUP.md.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing access token. Please sign in.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        r = httpx.get(f"{settings.supabase_url}/auth/v1/user",
                      headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}, timeout=8)
    except httpx.HTTPError:
        raise HTTPException(503, "Could not reach the authentication service.")
    if r.status_code != 200:
        raise HTTPException(401, "Your session is invalid or has expired. Please sign in again.")
    data = r.json()
    if not data.get("id"):
        raise HTTPException(401, "Invalid session.")
    return User(id=data["id"], email=data.get("email"), token=token)
