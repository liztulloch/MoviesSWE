from sqlalchemy import Column, DateTime, ForeignKey, Integer

from ..Database import Base


class UserSession(Base):
    __tablename__ = "UserSession"
    __table_args__ = {"schema": "cinema_booking"}

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("cinema_booking.User.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    # Naive MySQL DATETIME values represent UTC throughout this app.
    expires_at = Column(DateTime, nullable=False)
