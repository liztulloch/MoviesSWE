
from typing import List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    SecretStr
)

from ..Models.Customer_Models import Customer
from .Movie_schema import MovieSchema

class ProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str
    mailing_address: str | None
    receive_promotion: bool
    favorite_movies: list[MovieSchema] = Field(default_factory=list)
    

    @classmethod
    def from_customer(cls, customer: Customer) -> "ProfileSchema":
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
            favorite_movies=[
                MovieSchema.from_movie(favorite.movie)
                for favorite in customer.favorite_movies
            ]
        )

 
class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(min_length=1, max_length=500)
    last_name: str = Field(min_length=1, max_length=500)
    phone: str = Field(min_length=1, max_length=20)

    mailing_address: str | None = Field(
        max_length=200,
        default=None
    )

    receive_promotion: bool

    @field_validator("first_name", "last_name", "phone")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be blank.")

        return value

    @field_validator("mailing_address")
    @classmethod
    def clean_address(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip() or None

class FavoriteMovieRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    movie_id: int
    
class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: SecretStr = Field(min_length=1)

    new_password: SecretStr = Field(
        min_length=8,
        max_length=300,
    )
    
