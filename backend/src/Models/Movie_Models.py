"""
models.py

SQLAlchemy ORM models for the `cinema_booking` schema.
"""

from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..Database import Base


class Movie(Base):
    __tablename__ = "Movie"
    __table_args__ = {"schema": "cinema_booking"}

    movie_id = Column(Integer, primary_key=True, autoincrement=True)
    poster = Column(String(500), nullable=True)
    title = Column(String(255), nullable=False)
    mpaa_rating = Column(String(100), nullable=True)
    synopsis = Column(Text, nullable=True)
    genre = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)
    trailer = Column(String(500), nullable=True)
    trailer_image = Column(String(500), nullable=True)
    reviews = Column(String(500), nullable=True)

    movie_roles = relationship(
        "MovieRole", back_populates="movie", cascade="all, delete-orphan"
    )
    showtimes = relationship(
        "Showtime", back_populates="movie", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Movie id={self.movie_id} title={self.title!r} status={self.status!r}>"


class Person(Base):
    __tablename__ = "Person"
    __table_args__ = {"schema": "cinema_booking"}

    person_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)

    movie_roles = relationship(
        "MovieRole", back_populates="person", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Person id={self.person_id} name={self.full_name!r}>"


class MovieRole(Base):
    __tablename__ = "MovieRole"
    __table_args__ = {"schema": "cinema_booking"}

    movie_id = Column(Integer, ForeignKey("cinema_booking.Movie.movie_id"), primary_key=True)
    person_id = Column(Integer, ForeignKey("cinema_booking.Person.person_id"), primary_key=True)
    role = Column(String(50), nullable=False, primary_key=True)
    character_name = Column(String(255), nullable=True)

    movie = relationship("Movie", back_populates="movie_roles")
    person = relationship("Person", back_populates="movie_roles")

    def __repr__(self) -> str:
        return f"<MovieRole movie={self.movie_id} person={self.person_id} role={self.role!r}>"


class Showtime(Base):
    __tablename__ = "Showtime"
    __table_args__ = (
        UniqueConstraint("movie_id", "hall_id", "show_date", "show_time"),
        {"schema": "cinema_booking"},
    )

    showtime_id = Column(Integer, primary_key=True, autoincrement=True)
    movie_id = Column(Integer, ForeignKey("cinema_booking.Movie.movie_id"), nullable=False)
    # TheaterHall isn't modeled here yet — send its DDL and I'll add the
    # class + a `hall` relationship on Showtime.
    hall_id = Column(Integer, ForeignKey("cinema_booking.TheaterHall.hall_id"), nullable=False)
    show_date = Column(Date, nullable=False)
    show_time = Column(String(10), nullable=False)

    movie = relationship("Movie", back_populates="showtimes")

    def __repr__(self) -> str:
        return (
            f"<Showtime id={self.showtime_id} movie={self.movie_id} "
            f"date={self.show_date} time={self.show_time!r}>"
        )