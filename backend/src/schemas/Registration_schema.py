from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator
from datetime import date

class RegistrationCardRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cardholder_name: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"\S"
    )

    card_number: SecretStr = Field(
        min_length=12,
        max_length=19,
    )

    billing_address: str = Field(
        min_length=1,
        max_length=200,
        pattern=r"\S",
    )

    expiration_date: date

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, value: SecretStr) -> SecretStr:
        number = value.get_secret_value()

        if any(character not in "0123456789" for character in number):
            raise ValueError("Card number must contain only digits.")

        return value

class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(
        min_length=1,
        max_length=500,
        pattern=r"\S",
    )
    last_name: str = Field(
        min_length=1,
        max_length=500,
        pattern=r"\S",
    )
    email: EmailStr = Field(min_length=1, max_length=500)
    mailing_address: str | None = Field(min_length=0, max_length=200, default=None)
    phone: str = Field(
        min_length=1,
        max_length=20,
        pattern=r"\S"
    )
    password: SecretStr = Field(min_length=8, max_length=300)
    promotion_opt_in: bool = False
    
    cards: list[RegistrationCardRequest] = Field(
    default_factory=list,
    max_length=3,
)
    
    
class VerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    code: str = Field(pattern=r"^[0-9]{4}$")
    
class ResendVerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr