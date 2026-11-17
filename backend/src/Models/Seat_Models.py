from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..Database import Base


class Seat(Base):
    __tablename__ = "Seat"
    __table_args__ = (
        UniqueConstraint("hall_id", "seat_number"),
        {"schema": "cinema_booking"},
    )

    seat_id = Column(Integer, primary_key=True, autoincrement=True)
    seat_number = Column(Integer, nullable=False)
    hall_id = Column(Integer, ForeignKey("cinema_booking.TheaterHall.hall_id"), nullable=False)

    hall = relationship("TheaterHall", back_populates="seats")
    show_seats = relationship("ShowSeat", back_populates="seat")


class ShowSeat(Base):
    __tablename__ = "ShowSeat"
    __table_args__ = (
        UniqueConstraint("showtime_id", "seat_id"),
        {"schema": "cinema_booking"},
    )

    show_seat_id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(String(20), nullable=False)
    draft_id = Column(Integer, ForeignKey("cinema_booking.BookingDraft.draft_id", ondelete="SET NULL"), nullable=True)
    seat_id = Column(Integer, ForeignKey("cinema_booking.Seat.seat_id"), nullable=False)
    showtime_id = Column(Integer, ForeignKey("cinema_booking.Showtime.showtime_id"), nullable=False)

    draft = relationship("BookingDraft", back_populates="show_seats")
    seat = relationship("Seat", back_populates="show_seats")
    showtime = relationship("Showtime", back_populates="show_seats")
