from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..Models.User_Model import User, Admin
from ..Models.Customer_Models import Customer
from ..Models.Session_Model import UserSession
from .security_service import (
    verify_password,
    create_access_token,
    JWT_EXPIRATION_MINUTES,
)


class AuthError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def login_user(db: Session, email: str, password: str) -> dict:
    email = email.strip().lower()
    try:
        # Serialize login with password changes/reset on the same account.
        user = db.scalar(
            select(User).where(User.email == email).with_for_update()
        )
        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("Invalid email or password.", 401)

        if user.role == "Customer":
            customer = db.get(Customer, user.user_id)
            if customer is None:
                raise AuthError("Customer account not found.", 403)
            if customer.status == "Suspended":
                raise AuthError("Your account is suspended.", 403)
            if customer.status != "Active":
                raise AuthError("Please verify your account before logging in.", 403)
        elif user.role == "Admin":
            if db.get(Admin, user.user_id) is None:
                raise AuthError("Admin account not found.", 403)
        else:
            raise AuthError("This account does not have a valid role.", 403)

        expiration = datetime.now(timezone.utc) + timedelta(
            minutes=JWT_EXPIRATION_MINUTES
        )
        login_session = UserSession(
            user_id=user.user_id,
            expires_at=expiration.replace(tzinfo=None),
        )
        db.add(login_session)
        db.flush()  # Obtain MySQL's auto-increment session ID.
        token = create_access_token(
            user.user_id, login_session.session_id, expiration
        )
        response = {
            "access_token": token,
            "token_type": "bearer",
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
        db.commit()
    except Exception:
        db.rollback()
        raise
    return response
