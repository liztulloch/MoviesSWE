
from typing import List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)

from ..Models.User_Models import Customer

class CustomerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str
    mailing_address: str
    receive_promotion: bool
    

    @classmethod
    def from_customer(cls, customer: Customer) -> "CustomerSchema":
        user = customer.user
        return cls(
            customer_id=customer.customer_id,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=f"{user.first_name} {user.last_name}",
            email=user.email,
            phone=user.phone,
            mailing_address=customer.mailing_address,
            receive_promotion=customer.receive_promotion,
        )

 
class CustomerUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=30)

    mailing_address: str = Field(
        max_length=200,
    )

    receive_promotion: bool

    @field_validator("first_name", "last_name", "phone", "mailing_address")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be blank.")

        return value
