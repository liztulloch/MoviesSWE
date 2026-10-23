from sqlalchemy import select
from sqlalchemy.orm import Session

from ..Models.User_Model import User
from ..Models.Customer_Models import Customer
from .security_service import verify_password, create_access_token

class AuthError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
def login_user(
    db: Session,
    email: str,
    password: str,
) -> dict:

    email = email.strip().lower()

    # 1. Look up user by email
    user = db.scalar(
        select(User).where(User.email == email)
    )

    # 2. Email doesn't exist
    if user is None:
        raise AuthError(
            message="Invalid email or password.",
            status_code=401
        )

    # 3. Email exists, but password is wrong
    if not verify_password(password, user.password_hash):
        raise AuthError(
            message="Invalid email or password.",
            status_code=401
        )

    # 4. Check customer/account
    customer = db.get(
        Customer,
        user.user_id
    )

    if customer is None:
        raise AuthError(
            message="Customer account not found.",
            status_code=404
        )

    if customer.status != "Active":
        raise AuthError(
            message="Please verify your account before logging in.",
            status_code=403
        )

    # 5. Everything is valid → create JWT
    token = create_access_token(user.user_id)

    return {
    "access_token": token,
    "token_type": "bearer",
    "first_name": user.first_name,
    "last_name": user.last_name,
    "role": user.role
}