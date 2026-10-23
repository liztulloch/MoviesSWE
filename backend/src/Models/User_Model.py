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

    phone = Column("phone_number", String(20))
    
    # Python attribute: password_hash
    # Actual SQL column: password
    password_hash = Column(
        "password",
        String(300),
        nullable=False,
    )
    
    role = Column(
        String(50),
        nullable=False
    )

    customer = relationship(
        "Customer",
        back_populates="user",
        uselist=False,
    )
    

class Admin(Base):
    __tablename__ = "Admin"
    __table_args__ = {"schema": "cinema_booking"}

    admin_id = Column(
        Integer,
        ForeignKey("cinema_booking.User.user_id"),
        primary_key=True,
        nullable=False,
    )