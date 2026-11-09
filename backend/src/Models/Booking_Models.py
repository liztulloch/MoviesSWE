from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from ..Database import Base


class BookingDraft(Base):
    __tablename__ = "BookingDraft"
    __table_args__ = (
        CheckConstraint("adult >= 0 AND child >= 0 AND senior >= 0", name="ck_draft_counts"),
        CheckConstraint("adult + child + senior > 0", name="ck_draft_has_tickets"),
        {"schema": "cinema_booking"},
    )

    draft_id = Column(Integer, primary_key=True, autoincrement=True)
    showtime_id = Column(Integer, ForeignKey("cinema_booking.Showtime.showtime_id"), nullable=False)
    customer_id = Column(
        Integer,
        ForeignKey("cinema_booking.Customer.customer_id", name="fk_draft_customer"),
        nullable=True,
    )
    adult = Column(Integer, nullable=False)
    child = Column(Integer, nullable=False)
    senior = Column(Integer, nullable=False)
    access_token_hash = Column(String(64), nullable=True, unique=True)
    checkout_email = Column(String(254), nullable=True)

    customer = relationship("Customer", back_populates="booking_drafts")
    showtime = relationship("Showtime", back_populates="booking_drafts")

    show_seats = relationship("ShowSeat", back_populates="draft", passive_deletes=True)


class TicketPrice(Base):
    __tablename__ = "TicketPrice"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_ticket_price_nonnegative"),
        {"schema": "cinema_booking"},
    )

    ticket_type = Column(Enum("Adult", "Child", "Senior"), primary_key=True)
    price = Column(Numeric(7, 2), nullable=False)
