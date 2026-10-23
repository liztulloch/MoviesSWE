from datetime import date

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator

from ..Models.Customer_Models import CreditCard
from ..Services.security_service import decrypt_card_number


class CardRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cardholder_name: str = Field(min_length=1, max_length=100, pattern=r"\S")
    card_number: SecretStr = Field(min_length=13, max_length=19)
    billing_address: str = Field(min_length=1, max_length=200, pattern=r"\S")
    expiration_date: date

    @field_validator("cardholder_name", "billing_address")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, value: SecretStr) -> SecretStr:
        number = value.get_secret_value()
        if any(character not in "0123456789" for character in number):
            raise ValueError("Card number must contain only digits.")

        total = 0
        for index, character in enumerate(reversed(number)):
            digit = int(character)
            if index % 2 == 1:
                digit *= 2
                if digit > 9:
                    digit -= 9
            total += digit

        if total % 10 != 0:
            raise ValueError("Card number is not valid.")
        return value

    @field_validator("expiration_date")
    @classmethod
    def reject_expired_card(cls, value: date) -> date:
        today = date.today()
        # Cards remain valid through the end of their expiration month.
        if (value.year, value.month) < (today.year, today.month):
            raise ValueError("This card has expired.")
        return value


class SavedCardSchema(BaseModel):
    card_id: int
    cardholder_name: str
    brand: str
    last4: str
    billing_address: str
    expiration_date: date

    @classmethod
    def from_card(cls, card: CreditCard) -> "SavedCardSchema":
        number = decrypt_card_number(card.card_number)
        brand = "Card"
        if number.startswith("4"):
            brand = "Visa"
        elif 51 <= int(number[:2]) <= 55 or 22 <= int(number[:2]) <= 27:
            brand = "Mastercard"
        elif number.startswith(("34", "37")):
            brand = "Amex"
        elif number.startswith(("6011", "65")):
            brand = "Discover"

        return cls(
            card_id=card.card_id,
            cardholder_name=card.cardholder_name,
            brand=brand,
            last4=number[-4:],
            billing_address=card.billing_address,
            expiration_date=card.expiration_date,
        )
