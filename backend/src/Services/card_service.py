from sqlalchemy import select
from sqlalchemy.orm import Session

from ..Models.User_Model import User
from ..Models.Customer_Models import Customer, CreditCard
from ..schemas.Card_schema import CardRequest, SavedCardSchema
from .profile_service import ProfileError
from .security_service import encrypt_card_number


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


def add_customer_card(db: Session, user_id: int, data: CardRequest) -> SavedCardSchema:
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
        db.commit()
        return response
    except Exception:
        db.rollback()
        raise


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
        db.delete(card)
        db.commit()
        return {"message": "Payment card removed successfully."}
    except Exception:
        db.rollback()
        raise
