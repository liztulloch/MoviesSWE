from datetime import datetime, timezone

import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Models.Session_Model import UserSession
from ..Services.security_service import decode_access_token


def get_current_session(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UserSession:
    unauthorized = HTTPException(
        status_code=401,
        detail="Please log in with valid credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if authorization is None:
        raise unauthorized

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authentication scheme.")
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
        session_id = payload["sid"]
        if user_id <= 0:
            raise ValueError("Invalid user ID.")
        if type(session_id) is not int or session_id <= 0:
            raise ValueError("Invalid session ID.")
    except (jwt.InvalidTokenError, ValueError, TypeError, KeyError) as error:
        raise unauthorized from error

    login_session = db.get(UserSession, session_id)
    if login_session is None or login_session.user_id != user_id:
        raise unauthorized
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if login_session.expires_at <= now:
        raise unauthorized
    return login_session


def get_authenticated_user_id(
    login_session: UserSession = Depends(get_current_session),
) -> int:
    return login_session.user_id
