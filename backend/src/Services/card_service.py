import smtplib

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..Models.User_Model import User
from ..Models.Customer_Models import Customer, CreditCard
from ..schemas.Card_schema import CardRequest, CardUpdateRequest, SavedCardSchema, CardAddedResponse, CardUpdatedResponse
from .profile_service import ProfileError
from .security_service import encrypt_card_number
from .email_service import send_generic_email


def send_card_update_notification(email: str) -> bool:
    try:
        send_generic_email("Your Cinema account was updated", "Your account was updated.", email)
    except (smtplib.SMTPException, OSError):
        return False
    return True


def lock_active_customer(db: Session, user_id: int) -> Customer:
    user = db.scalar(select(User).where(User.user_id == user_id).with_for_update())
    if user is None:
        raise ProfileError("Account not found.", 404)
    customer = db.get(Customer, user_id, with_for_update=True)
    if customer is None:
        raise ProfileError("Customer profile not found.", 404)
    if customer.status != "Active":
        raise ProfileError("This account cannot manage payment cards.", 403)
    return customer


def add_customer_card(db: Session, user_id: int, data: CardRequest) -> CardAddedResponse:
    try:
        customer = lock_active_customer(db, user_id)
     
        existing_cards = db.scalars(
            select(CreditCard.card_id)
            .where(CreditCard.customer_id == customer.customer_id)
            .with_for_update()
        ).all()
        if len(existing_cards) >= 3:
            raise ProfileError("You can save up to three payment cards.", 409)

        card = CreditCard(
            customer_id=customer.customer_id,
            cardholder_name=data.cardholder_name,
            card_number=encrypt_card_number(data.card_number.get_secret_value()),
            billing_address=data.billing_address,
            expiration_date=data.expiration_date,
        )
        db.add(card)
        db.flush()
        response = SavedCardSchema.from_card(card)
        email = customer.user.email
        db.commit()
    except Exception:
        db.rollback()
        raise

    notification_sent = send_card_update_notification(email)
    return CardAddedResponse(
        **response.model_dump(),
        message=("Payment card added successfully." if notification_sent else
                 "Your payment card was added, but the notification email could not be sent."),
        notification_sent=notification_sent,
    )


def update_customer_card(
    db: Session, user_id: int, card_id: int, data: CardUpdateRequest,
) -> CardUpdatedResponse:
    try:
        customer = lock_active_customer(db, user_id)
        card = db.scalar(
            select(CreditCard).where(
                CreditCard.card_id == card_id,
                CreditCard.customer_id == customer.customer_id,
            ).with_for_update()
        )
        if card is None:
            raise ProfileError("Payment card not found.", 404)
        card.cardholder_name = data.cardholder_name
        card.billing_address = data.billing_address
        card.expiration_date = data.expiration_date
        if data.card_number is not None:
            card.card_number = encrypt_card_number(data.card_number.get_secret_value())
        response = SavedCardSchema.from_card(card)
        email = customer.user.email
        db.commit()
    except Exception:
        db.rollback()
        raise

    notification_sent = send_card_update_notification(email)
    return CardUpdatedResponse(
        **response.model_dump(),
        message=("Payment card updated successfully." if notification_sent else
                 "Your payment card was updated, but the notification email could not be sent."),
        notification_sent=notification_sent,
    )


def remove_customer_card(db: Session, user_id: int, card_id: int) -> dict:
    try:
        customer = lock_active_customer(db, user_id)
        card = db.scalar(
            select(CreditCard).where(
                CreditCard.card_id == card_id,
                CreditCard.customer_id == customer.customer_id,
            ).with_for_update()
        )
        if card is None:
            raise ProfileError("Payment card not found.", 404)
        email = customer.user.email
        db.delete(card)
        db.commit()
    except Exception:
        db.rollback()
        raise

    notification_sent = send_card_update_notification(email)
    return {
        "message": ("Payment card removed successfully." if notification_sent else
                    "Your payment card was removed, but the notification email could not be sent."),
        "notification_sent": notification_sent,
    }
