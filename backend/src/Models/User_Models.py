from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from ..Database import Base


class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "cinema_booking"}

    user_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    first_name = Column(String(500), nullable=False)
    last_name = Column(String(500), nullable=False)

    email = Column(
        String(500),
        nullable=False,
        unique=True,
    )

    phone = Column("phone_number", String(30), nullable=False)

    # Python attribute: password_hash
    # Actual SQL column: password
    password_hash = Column(
        "password",
        String(300),
        nullable=False,
    )

    customer = relationship(
        "Customer",
        back_populates="user",
        uselist=False,
    )


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