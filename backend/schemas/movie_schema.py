"""
movie_schema.py
 
SQLAlchemy ORM model + Pydantic schema for the `cinema_booking`.`Movie` table.
"""
 
from decimal import Decimal
from typing import List, Optional, cast
 
from sqlalchemy import Column, Integer, String, Text,DECIMAL
from sqlalchemy.orm import declarative_base
 
from pydantic import BaseModel, ConfigDict
 
Base = declarative_base()
 
 
# ---------------------------------------------------------------------------
# ORM Model — mirrors the CREATE TABLE statement exactly
# ---------------------------------------------------------------------------
class Movie(Base):
    __tablename__ = "Movie"
    __table_args__ = {"schema": "cinema_booking"}
 
    movie_id = Column(Integer, primary_key=True, autoincrement=True)
    poster = Column(String(500), nullable=True)
    title = Column(String(255), nullable=False)
    rating = Column(DECIMAL, nullable=True)
    synopsis = Column(Text, nullable=True)
    genre = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)
    trailer = Column(String(500), nullable=True)
    showtimes = Column(String(500), nullable=True)  # Comma-separated list of showtimes

    movie_roles = relationship(
        "MovieRole",
        back_populates="movie",
        cascade="all, delete-orphan",
    )
 
    def __repr__(self) -> str:
        return f"<Movie id={self.movie_id} title={self.title!r} status={self.status!r}>"
 
 
class Person(Base):
    __tablename__ = "Person"
    __table_args__ = {"schema": "cinema_booking"}
 
    person_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
 
    # One Person -> many MovieRole rows (their credits across movies).
    movie_roles = relationship(
        "MovieRole",
        back_populates="person",
        cascade="all, delete-orphan",
    )
 
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
 
    def __repr__(self) -> str:
        return f"<Person id={self.person_id} name={self.full_name!r}>"
    
class MovieRole(Base):
    __tablename__ = "MovieRole"
    __table_args__ = {"schema": "cinema_booking"}
 
    movie_id = Column(
        Integer, ForeignKey("cinema_booking.Movie.movie_id"), primary_key=True
    )
    person_id = Column(
        Integer, ForeignKey("cinema_booking.Person.person_id"), primary_key=True
    )
    role = Column(String(50), nullable=False, primary_key=True)  # 'actor', 'producer', ...
    character_name = Column(String(255), nullable=True)  # only meaningful for 'actor' rows
 
    movie = relationship("Movie", back_populates="movie_roles")
    person = relationship("Person", back_populates="movie_roles")
 
    def __repr__(self) -> str:
        return f"<MovieRole movie={self.movie_id} person={self.person_id} role={self.role!r}>"
 
 

# ---------------------------------------------------------------------------
# Pydantic schema — for API responses / serialization
# ---------------------------------------------------------------------------
class ProducerSchema(BaseModel):
    movie_id: int
    producers: List[str] = []
 
    @classmethod
    def from_movie(cls, movie: Movie) -> "ProducerSchema":
        producers = [
            mr.person.full_name
            for mr in movie.movie_roles
            if mr.role.lower() == "producer"
        ]
        return cls(movie_id=movie.movie_id, producers=producers)
 
 

class CastSchema(BaseModel):
    movie_id: int
    cast: List[str] = []
 
    @classmethod
    def from_movie(cls, movie: Movie) -> "CastSchema":
        cast = []
        for mr in movie.movie_roles:
            if mr.role.lower() != "actor":
                continue
            name = mr.person.full_name
            # append the character they played, if one is recorded
            cast.append(f"{name} as {mr.character_name}" if mr.character_name else name)
        return cls(movie_id=movie.movie_id, cast=cast)
   
class MovieSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    movie_id: int
    poster: Optional[str] = None
    title: str
    rating: Optional[float] = None
    synopsis: Optional[str] = None
    genre: Optional[str] = None
    status: str
    trailer: Optional[str] = None
    cast: Optional[List[CastSchema]] = None
    producer: Optional[ProducerSchema] = None    
    showtimes: Optional[List[str]] = None
    