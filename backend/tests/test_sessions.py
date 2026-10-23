"""Session lifecycle checks using isolated SQLite and no email delivery."""

import os
import secrets
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
from cryptography.fernet import Fernet
from fastapi import HTTPException
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

# Import-time configuration is isolated from the developer's actual secrets.
with patch.dict(os.environ, {
    "CARD_ENCRYPTION_KEY": Fernet.generate_key().decode("ascii"),
    "JWT_SECRET": secrets.token_urlsafe(48),
}):
    from src.Models.User_Model import User, Admin
    from src.Models.Customer_Models import Customer
    from src.Models.Session_Model import UserSession
    from src.Services import security_service as security
    from src.Services.auth_service import AuthError, login_user
    from src.Services import profile_service
    from src.Routes.Auth_routes import logout
    from src.dependencies.auth_dependency import get_current_session
    from src.schemas.Profile_schema import ChangePasswordRequest, ResetPasswordRequest
    from src.Database import Base


class SessionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = "OriginalPassword123!"
        cls.password_hash = security.hash_password(cls.password)

    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")

        @event.listens_for(self.engine, "connect")
        def configure(connection, record):
            connection.execute("ATTACH DATABASE ':memory:' AS cinema_booking")
            connection.execute("PRAGMA foreign_keys=ON")

        Base.metadata.create_all(self.engine, tables=[
            User.__table__, Customer.__table__,
            Admin.__table__, UserSession.__table__,
        ])
        self.mail = patch.object(profile_service, "send_generic_email")
        self.mail.start()
        self.addCleanup(self.mail.stop)
        self.addCleanup(self.engine.dispose)

        with self.database() as db:
            for user_id in (1, 2):
                db.add(User(
                    user_id=user_id, first_name="Test", last_name="Customer",
                    email=f"customer{user_id}@example.com", phone="7065550123",
                    password_hash=self.password_hash, role="Customer",
                ))
            db.flush()
            for user_id in (1, 2):
                db.add(Customer(customer_id=user_id, status="Active"))
            db.commit()

    def database(self):
        return Session(self.engine, autoflush=False)

    def login(self, user_id=1, password=None):
        with self.database() as db:
            result = login_user(
                db, f"customer{user_id}@example.com", password or self.password
            )
            return result["access_token"]

    def authenticate(self, token):
        with self.database() as db:
            return get_current_session("Bearer " + token, db)

    def assert_rejected(self, token):
        with self.assertRaises(HTTPException) as caught:
            self.authenticate(token)
        self.assertEqual(caught.exception.status_code, 401)

    def test_login_creates_integer_session(self):
        token = self.login()
        claims = security.decode_access_token(token)
        self.assertEqual(claims["sub"], "1")
        self.assertIs(type(claims["sid"]), int)
        self.assertEqual(self.authenticate(token).session_id, claims["sid"])

    def test_separate_logins_get_separate_sessions(self):
        first, second = self.login(), self.login()
        self.assertNotEqual(
            security.decode_access_token(first)["sid"],
            security.decode_access_token(second)["sid"],
        )

    def test_logout_deletes_only_current_session(self):
        first, second, other = self.login(), self.login(), self.login(2)
        with self.database() as db:
            session = get_current_session("Bearer " + first, db)
            logout(login_session=session, db=db)
        self.assert_rejected(first)
        self.authenticate(second)
        self.authenticate(other)
        with self.database() as db:
            self.assertIsNone(db.get(
                UserSession, security.decode_access_token(first)["sid"]
            ))

    def test_password_change_deletes_all_own_sessions(self):
        first, second, other = self.login(), self.login(), self.login(2)
        with self.database() as db:
            profile_service.change_password(db, 1, ChangePasswordRequest(
                current_password=self.password, new_password="ChangedPassword456!"
            ))
        self.assert_rejected(first)
        self.assert_rejected(second)
        self.authenticate(other)
        self.authenticate(self.login(password="ChangedPassword456!"))

    def test_wrong_password_preserves_sessions(self):
        token = self.login()
        with self.database() as db:
            with self.assertRaises(profile_service.ProfileError):
                profile_service.change_password(db, 1, ChangePasswordRequest(
                    current_password="incorrect", new_password="ChangedPassword456!"
                ))
        self.authenticate(token)

    def test_failed_commit_rolls_back_password_and_session_deletion(self):
        token = self.login()
        with self.database() as db:
            with patch.object(db, "commit", side_effect=SQLAlchemyError("test failure")):
                with self.assertRaises(SQLAlchemyError):
                    profile_service.change_password(db, 1, ChangePasswordRequest(
                        current_password=self.password,
                        new_password="ChangedPassword456!",
                    ))
        self.authenticate(token)
        self.authenticate(self.login())

    def test_reset_deletes_sessions_and_consumes_code(self):
        first, second, other = self.login(), self.login(), self.login(2)
        with self.database() as db:
            db.get(Customer, 1).password_reset_code_hash = security.hash_password("0482")
            db.commit()
        request = ResetPasswordRequest(
            email="customer1@example.com", code="0482",
            new_password="ResetPassword456!",
        )
        with self.database() as db:
            profile_service.reset_password(db, request)
        self.assert_rejected(first)
        self.assert_rejected(second)
        self.authenticate(other)
        self.authenticate(self.login(password="ResetPassword456!"))
        with self.database() as db:
            with self.assertRaises(profile_service.ProfileError):
                profile_service.reset_password(db, request)

    def test_wrong_reset_code_preserves_session(self):
        token = self.login()
        with self.database() as db:
            db.get(Customer, 1).password_reset_code_hash = security.hash_password("0482")
            db.commit()
        with self.database() as db:
            with self.assertRaises(profile_service.ProfileError):
                profile_service.reset_password(db, ResetPasswordRequest(
                    email="customer1@example.com", code="9999",
                    new_password="ResetPassword456!",
                ))
        self.authenticate(token)

    def test_expired_database_session_is_rejected(self):
        token = self.login()
        session_id = security.decode_access_token(token)["sid"]
        with self.database() as db:
            db.get(UserSession, session_id).expires_at = (
                datetime.now(timezone.utc) - timedelta(seconds=1)
            ).replace(tzinfo=None)
            db.commit()
        self.assert_rejected(token)

    def test_expired_jwt_is_rejected(self):
        token = self.login()
        claims = security.decode_access_token(token)
        claims["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
        expired = jwt.encode(claims, security.JWT_SECRET_KEY, algorithm="HS256")
        self.assert_rejected(expired)

    def test_missing_header_malformed_and_legacy_tokens_are_rejected(self):
        with self.database() as db:
            with self.assertRaises(HTTPException) as caught:
                get_current_session(None, db)
            self.assertEqual(caught.exception.status_code, 401)
        self.assert_rejected("not-a-jwt")
        legacy = jwt.encode({
            "sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)
        }, security.JWT_SECRET_KEY, algorithm="HS256")
        self.assert_rejected(legacy)

    def test_mismatched_session_owner_is_rejected(self):
        token = self.login()
        claims = security.decode_access_token(token)
        claims["sub"] = "2"
        mismatched = jwt.encode(claims, security.JWT_SECRET_KEY, algorithm="HS256")
        self.assert_rejected(mismatched)

    def test_invalid_login_creates_no_session(self):
        with self.database() as db:
            with self.assertRaises(AuthError):
                login_user(db, "customer1@example.com", "incorrect")
            self.assertEqual(db.scalars(select(UserSession)).all(), [])

    def test_admin_login_creates_session(self):
        with self.database() as db:
            db.add(User(
                user_id=3, first_name="Test", last_name="Admin",
                email="admin@example.com", phone="7065550123",
                password_hash=self.password_hash, role="Admin",
            ))
            db.flush()
            db.add(Admin(admin_id=3))
            db.commit()
            response = login_user(db, "admin@example.com", self.password)
        self.assertEqual(response["role"], "Admin")
        self.assertEqual(self.authenticate(response["access_token"]).user_id, 3)


if __name__ == "__main__":
    unittest.main()
