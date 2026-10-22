from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Date
)
from sqlalchemy.orm import relationship
from ..Database import Base


class Customer(Base):
    __tablename__ = "Customer"
    __table_args__ = {"schema": "cinema_booking"}

    customer_id = Column(
        Integer,
        ForeignKey("cinema_booking.User.user_id"),
        primary_key=True,
    )

    mailing_address = Column(
        String(200),
        nullable=True,
    )

    status = Column(
        Enum("Active", "Inactive", "Suspended"),
        nullable=False,
        default="Inactive",
    )

    # Python attribute: verification_code_hash
    # Actual SQL column: confirmation_code
    verification_code_hash = Column(
        "confirmation_code",
        String(300),
        nullable=True,
    )

    # Python attribute: password_reset_code_hash
    # Actual SQL column: reset_code
    password_reset_code_hash = Column(
        "reset_code",
        String(300),
        nullable=True,
    )

    receive_promotion = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    user = relationship(
        "User",
        back_populates="customer",
    )
    
    cards = relationship(
        "CreditCard",
        back_populates="customer",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    favorite_movies = relationship(
        "FavoriteMovie",
        back_populates="customer",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
class CreditCard(Base):
     __tablename__ = "CreditCard"
     __table_args__ = {"schema": "cinema_booking"}
     
     card_id = Column(
         Integer,
         primary_key=True,
         autoincrement=True
     )
     
     customer_id = Column(
         Integer,
         ForeignKey("cinema_booking.Customer.customer_id", ondelete="CASCADE"),
         nullable=False,
     )
     
     card_number = Column(
         String(512),
         nullable=False
     )
     
     cardholder_name = Column(
         String(100),
         nullable=False
     )
     
     billing_address = Column(
         String(200),
         nullable=False
     )
     
     expiration_date = Column(
         Date,
         nullable=False
     )
     
     customer = relationship(
         "Customer",
         back_populates="cards"
     )
     
   
     