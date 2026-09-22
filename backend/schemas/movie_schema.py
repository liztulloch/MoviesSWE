"""
movie_schema.py
 
SQLAlchemy ORM model + Pydantic schema for the `cinema_booking`.`Movie` table.
"""
 
from decimal import Decimal
from typing import Optional
 
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
    description = Column(Text, nullable=True)
    genre = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)
    trailer = Column(String(500), nullable=True)
 
    def __repr__(self) -> str:
        return f"<Movie id={self.movie_id} title={self.title!r} status={self.status!r}>"
 
 
# ---------------------------------------------------------------------------
# Pydantic schema — for API responses / serialization
# ---------------------------------------------------------------------------
class MovieSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    movie_id: int
    poster: Optional[str] = None
    title: str
    rating: Optional[float] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    status: str
    trailer: Optional[str] = None
 