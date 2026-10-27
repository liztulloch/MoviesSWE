"""Card validation, API ownership, masking, limits, and transaction checks."""
import os
import secrets
import smtplib
import unittest
from datetime import date
from unittest.mock import patch

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

with patch.dict(os.environ, {
    "CARD_ENCRYPTION_KEY": Fernet.generate_key().decode("ascii"),
    "JWT_SECRET": secrets.token_urlsafe(48),
}):
    from src.Database import Base, get_db
    from src.main import app
    from src.Models.User_Model import User, Admin
    from src.Models.Customer_Models import Customer, CreditCard
    from src.Models.Movie_Models import Movie, FavoriteMovie
    from src.Models.Session_Model import UserSession
    from src.schemas.Card_schema import CardRequest, CardUpdateRequest
    from src.Services.card_service import add_customer_card, update_customer_card
    from src.Services import card_service
    from src.Services.security_service import hash_password, decrypt_card_number


def card_body():
    return {
        "cardholder_name": "Test Customer",
        "card_number": "4111111111111111",
        "billing_address": "1 Test St",
        "expiration_date": f"{date.today().year + 2}-12-31",
    }


class CardValidationTests(unittest.TestCase):
    def test_luhn_accepts_common_test_numbers(self):
        for number in ("4111111111111111", "5555555555554444", "378282246310005"):
            with self.subTest(number=number):
                CardRequest(**{**card_body(), "card_number": number})

    def test_invalid_checksum_digits_and_lengths(self):
        for number in ("4111111111111112", "123456789012", "4111 1111 1111 1111", "a" * 16, "1" * 20):
            with self.subTest(number=number), self.assertRaises(ValidationError):
                CardRequest(**{**card_body(), "card_number": number})

    def test_previous_month_rejected_current_month_accepted(self):
        today = date.today()
        previous = today.replace(day=1)
        from datetime import timedelta
        previous -= timedelta(days=1)
        with self.assertRaises(ValidationError):
            CardRequest(**{**card_body(), "expiration_date": previous.isoformat()})
        CardRequest(**{**card_body(), "expiration_date": today.replace(day=1).isoformat()})


class CardApiTests(unittest.TestCase):
    def setUp(self):
        mail_patch = patch.object(card_service, "send_generic_email")
        self.mail = mail_patch.start()
        self.addCleanup(mail_patch.stop)
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

        @event.listens_for(self.engine, "connect")
        def configure(connection, record):
            connection.execute("ATTACH DATABASE ':memory:' AS cinema_booking")
            connection.execute("PRAGMA foreign_keys=ON")

        Base.metadata.create_all(self.engine, tables=[
            User.__table__, Customer.__table__, Admin.__table__, UserSession.__table__,
            CreditCard.__table__, Movie.__table__, FavoriteMovie.__table__,
        ])
        with Session(self.engine) as db:
            password_hash = hash_password("CardTests123!")
            for identifier in (1, 2):
                db.add(User(user_id=identifier, first_name="Test", last_name="Customer",
                    email=f"card{identifier}@example.com", phone="7065550100",
                    password_hash=password_hash, role="Customer"))
            db.flush()
            db.add_all([Customer(customer_id=identifier, status="Active") for identifier in (1, 2)])
            db.commit()

        def database():
            with Session(self.engine, autoflush=False) as db:
                yield db

        app.dependency_overrides[get_db] = database
        self.addCleanup(app.dependency_overrides.pop, get_db, None)
        self.addCleanup(self.engine.dispose)
        self.client = TestClient(app)
        self.client.__enter__()
        self.addCleanup(self.client.__exit__, None, None, None)
        self.headers = []
        for identifier in (1, 2):
            response = self.client.post("/auth/login", json={"email": f"card{identifier}@example.com", "password": "CardTests123!"})
            self.assertEqual(response.status_code, 200)
            self.headers.append({"Authorization": "Bearer " + response.json()["access_token"]})

    def add(self, body=None, owner=0):
        return self.client.post("/user/cards", json=body or card_body(), headers=self.headers[owner])

    def test_add_profile_masks_and_encrypts_card(self):
        response = self.add()
        self.assertEqual(response.status_code, 201)
        saved = response.json()
        self.assertEqual(saved["brand"], "Visa")
        self.assertEqual(saved["last4"], "1111")
        self.assertNotIn("card_number", saved)
        profile = self.client.get("/user/me", headers=self.headers[0]).json()
        self.assertEqual(profile["cards"], [{key: value for key, value in saved.items() if key not in ("message", "notification_sent")}])
        with Session(self.engine) as db:
            stored = db.get(CreditCard, saved["card_id"])
            self.assertNotEqual(stored.card_number, card_body()["card_number"])
            self.assertEqual(decrypt_card_number(stored.card_number), card_body()["card_number"])

    def test_fourth_card_rejected_removal_frees_slot(self):
        cards = [self.add().json() for _ in range(3)]
        self.assertEqual(self.add().status_code, 409)
        response = self.client.delete(f"/user/cards/{cards[0]['card_id']}", headers=self.headers[0])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.add().status_code, 201)
        self.assertEqual(len(self.client.get("/user/me", headers=self.headers[0]).json()["cards"]), 3)

    def test_other_customer_cannot_delete_or_view_card(self):
        card_id = self.add().json()["card_id"]
        response = self.client.delete(f"/user/cards/{card_id}", headers=self.headers[1])
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.client.get("/user/me", headers=self.headers[1]).json()["cards"], [])
        self.assertEqual(len(self.client.get("/user/me", headers=self.headers[0]).json()["cards"]), 1)

    def test_authentication_required(self):
        self.assertEqual(self.client.post("/user/cards", json=card_body()).status_code, 401)
        self.assertEqual(self.client.delete("/user/cards/1").status_code, 401)

    def test_missing_card_returns_404(self):
        self.assertEqual(self.client.delete("/user/cards/99999", headers=self.headers[0]).status_code, 404)

    def test_suspended_customer_cannot_manage_cards(self):
        card_id = self.add().json()["card_id"]
        with Session(self.engine) as db:
            db.get(Customer, 1).status = "Suspended"
            db.commit()
        self.assertEqual(self.add().status_code, 403)
        self.assertEqual(self.client.delete(f"/user/cards/{card_id}", headers=self.headers[0]).status_code, 403)

    def test_registration_and_add_card_share_validation(self):
        for invalid in ({"card_number": "4111111111111112"}, {"expiration_date": "2020-01-01"}):
            body = {**card_body(), **invalid}
            self.assertEqual(self.add(body).status_code, 422)
            response = self.client.post("/reg/register", json={
                "first_name": "Test", "last_name": "Customer", "email": "invalid@example.com",
                "phone": "7065550100", "password": "CardTests123!", "cards": [body],
            })
            self.assertEqual(response.status_code, 422)

    def test_failed_commit_leaves_no_card(self):
        with Session(self.engine) as db:
            with patch.object(db, "commit", side_effect=SQLAlchemyError("test failure")):
                with self.assertRaises(SQLAlchemyError):
                    add_customer_card(db, 1, CardRequest(**card_body()))
        with Session(self.engine) as db:
            self.assertEqual(db.scalars(select(CreditCard)).all(), [])
        self.mail.assert_not_called()

    def test_add_and_remove_notify_owner_after_commit(self):
        def verify_saved_before_email(subject, content, email):
            self.assertEqual((subject, content, email), (
                "Your Cinema account was updated", "Your account was updated.", "card1@example.com",
            ))
            with Session(self.engine) as db:
                self.assertEqual(len(db.scalars(select(CreditCard)).all()), 1)

        self.mail.side_effect = verify_saved_before_email
        added = self.add()
        self.assertEqual(added.status_code, 201)
        self.assertTrue(added.json()["notification_sent"])
        self.mail.assert_called_once()

        def verify_removed_before_email(subject, content, email):
            self.assertEqual((subject, content, email), (
                "Your Cinema account was updated", "Your account was updated.", "card1@example.com",
            ))
            with Session(self.engine) as db:
                self.assertEqual(db.scalars(select(CreditCard)).all(), [])

        self.mail.side_effect = verify_removed_before_email
        removed = self.client.delete(f"/user/cards/{added.json()['card_id']}", headers=self.headers[0])
        self.assertEqual(removed.status_code, 200)
        self.assertTrue(removed.json()["notification_sent"])
        self.assertEqual(self.mail.call_count, 2)

    def test_email_failure_preserves_added_card_and_response(self):
        self.mail.side_effect = smtplib.SMTPException("test mail failure")
        added = self.add()
        self.assertEqual(added.status_code, 201)
        self.assertFalse(added.json()["notification_sent"])
        self.assertEqual(added.json()["last4"], "1111")
        profile = self.client.get("/user/me", headers=self.headers[0]).json()
        self.assertEqual(profile["cards"][0]["card_id"], added.json()["card_id"])

    def test_email_failure_preserves_card_removal(self):
        card_id = self.add().json()["card_id"]
        self.mail.side_effect = OSError("test mail failure")
        removed = self.client.delete(f"/user/cards/{card_id}", headers=self.headers[0])
        self.assertEqual(removed.status_code, 200)
        self.assertFalse(removed.json()["notification_sent"])
        self.assertEqual(self.client.get("/user/me", headers=self.headers[0]).json()["cards"], [])

    def test_rejected_card_changes_do_not_notify(self):
        self.assertEqual(self.add({**card_body(), "card_number": "4111111111111112"}).status_code, 422)
        self.assertEqual(self.client.delete("/user/cards/9999", headers=self.headers[0]).status_code, 404)
        self.mail.assert_not_called()
        card_id = self.add().json()["card_id"]
        self.add(); self.add()
        self.mail.reset_mock()
        self.assertEqual(self.add().status_code, 409)
        self.assertEqual(self.client.delete(f"/user/cards/{card_id}", headers=self.headers[1]).status_code, 404)
        self.mail.assert_not_called()



    def test_update_keeps_number_and_notifies_after_commit(self):
        card_id = self.add().json()["card_id"]
        self.mail.reset_mock()
        with Session(self.engine) as db:
            original = db.get(CreditCard, card_id).card_number
        body = {key: value for key, value in card_body().items() if key != "card_number"}
        body.update(cardholder_name="Updated Owner", billing_address="2 Updated St")

        def verify_committed(subject, content, email):
            self.assertEqual((subject, content, email), (
                "Your Cinema account was updated", "Your account was updated.", "card1@example.com",
            ))
            with Session(self.engine) as db:
                self.assertEqual(db.get(CreditCard, card_id).billing_address, "2 Updated St")
        self.mail.side_effect = verify_committed
        response = self.client.put(f"/user/cards/{card_id}", json=body, headers=self.headers[0])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["card_id"], card_id)
        self.assertTrue(response.json()["notification_sent"])
        self.assertNotIn("card_number", response.json())
        self.mail.assert_called_once()
        with Session(self.engine) as db:
            self.assertEqual(db.get(CreditCard, card_id).card_number, original)
        profile = self.client.get("/user/me", headers=self.headers[0]).json()
        self.assertEqual(profile["cards"][0]["cardholder_name"], "Updated Owner")

    def test_update_replaces_and_encrypts_number_at_three_card_limit(self):
        cards = [self.add().json() for _ in range(3)]
        body = {**card_body(), "card_number": "5555555555554444"}
        response = self.client.put(f"/user/cards/{cards[0]['card_id']}", json=body, headers=self.headers[0])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["last4"], "4444")
        self.assertEqual(response.json()["brand"], "Mastercard")
        with Session(self.engine) as db:
            card = db.get(CreditCard, cards[0]["card_id"])
            self.assertEqual(decrypt_card_number(card.card_number), "5555555555554444")
            self.assertNotEqual(card.card_number, "5555555555554444")
            self.assertEqual(len(db.scalars(select(CreditCard)).all()), 3)

    def test_update_checks_authentication_ownership_status_and_missing_card(self):
        card_id = self.add().json()["card_id"]
        self.mail.reset_mock()
        path = f"/user/cards/{card_id}"
        self.assertEqual(self.client.put(path, json=card_body()).status_code, 401)
        self.assertEqual(self.client.put(path, json=card_body(), headers=self.headers[1]).status_code, 404)
        self.assertEqual(self.client.put("/user/cards/99999", json=card_body(), headers=self.headers[0]).status_code, 404)
        with Session(self.engine) as db:
            db.get(Customer, 1).status = "Suspended"
            db.commit()
        self.assertEqual(self.client.put(path, json=card_body(), headers=self.headers[0]).status_code, 403)
        self.mail.assert_not_called()

    def test_invalid_update_rejected_without_changes_or_email(self):
        card_id = self.add().json()["card_id"]
        self.mail.reset_mock()
        for invalid in ({"card_number": "4111111111111112"}, {"expiration_date": "2020-01-01"}, {"billing_address": "   "}):
            response = self.client.put(f"/user/cards/{card_id}", json={**card_body(), **invalid}, headers=self.headers[0])
            self.assertEqual(response.status_code, 422)
        self.mail.assert_not_called()
        with Session(self.engine) as db:
            self.assertEqual(db.get(CreditCard, card_id).billing_address, "1 Test St")

    def test_update_email_failure_preserves_change(self):
        card_id = self.add().json()["card_id"]
        self.mail.side_effect = smtplib.SMTPException("test failure")
        response = self.client.put(f"/user/cards/{card_id}", json={**card_body(), "billing_address": "Changed address"}, headers=self.headers[0])
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["notification_sent"])
        with Session(self.engine) as db:
            self.assertEqual(db.get(CreditCard, card_id).billing_address, "Changed address")

    def test_failed_update_commit_rolls_back_and_does_not_notify(self):
        card_id = self.add().json()["card_id"]
        self.mail.reset_mock()
        with Session(self.engine) as db:
            with patch.object(db, "commit", side_effect=SQLAlchemyError("test failure")):
                with self.assertRaises(SQLAlchemyError):
                    update_customer_card(db, 1, card_id, CardUpdateRequest(**{**card_body(), "billing_address": "Unsaved"}))
        with Session(self.engine) as db:
            self.assertEqual(db.get(CreditCard, card_id).billing_address, "1 Test St")
        self.mail.assert_not_called()


if __name__ == "__main__":
    unittest.main()
