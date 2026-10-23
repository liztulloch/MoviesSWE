import jwt

from fastapi import Header, HTTPException

from ..Services.security_service import decode_access_token


def get_authenticated_user_id( 
    authorization: str = Header(...)
) -> int:

    try:
        scheme, token = authorization.split()

        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme."
            )

        user_id = decode_access_token(token)

        return user_id

    except (ValueError, jwt.InvalidTokenError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )