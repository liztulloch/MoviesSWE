"""
movie_schema.py

Pydantic schemas for API responses backed by the ORM `Movie` model.

This file intentionally contains only Pydantic models and helper
constructors (`from_movie`) that accept ORM `Movie` instances. The SQLAlchemy
ORM classes live in `src.Models.Movie_Models`.
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from ..Models.Movie_Models import Movie


class ProducerSchema(BaseModel):
    movie_id: int
    producers: List[str] = []

    @classmethod
    def from_movie(cls, movie: Movie) -> "ProducerSchema":
        producers = []
        for mr in getattr(movie, "movie_roles", []) or []:
            role = (mr.role or "").strip().lower()
            if role != "producer":
                continue
            person = getattr(mr, "person", None)
            if not person:
                continue
            # Prefer `full_name` property if present
            name = getattr(person, "full_name", None)
            if not name:
                fname = getattr(person, "first_name", "")
                lname = getattr(person, "last_name", "")
                name = f"{fname} {lname}".strip()
            if name:
                producers.append(name)
        return cls(movie_id=movie.movie_id, producers=producers)


class CastSchema(BaseModel):
    movie_id: int
    cast: List[str] = []

    @classmethod
    def from_movie(cls, movie: Movie) -> "CastSchema":
        cast = []
        for mr in getattr(movie, "movie_roles", []) or []:
            role = (mr.role or "").strip().lower()
            if role != "actor":
                continue
            person = getattr(mr, "person", None)
            if not person:
                continue
            name = getattr(person, "full_name", None)
            if not name:
                fname = getattr(person, "first_name", "")
                lname = getattr(person, "last_name", "")
                name = f"{fname} {lname}".strip()
            if not name:
                continue
            if getattr(mr, "character_name", None):
                cast.append(f"{name} as {mr.character_name}")
            else:
                cast.append(name)
        return cls(movie_id=movie.movie_id, cast=cast)


class MovieSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    movie_id: int
    poster: Optional[str] = None
    title: str
    mpaa_rating: Optional[str] = None
    synopsis: Optional[str] = None
    genre: Optional[str] = None
    status: str
    trailer: Optional[str] = None
    trailer_image: Optional[str] = None
    reviews: Optional[str] = None
    cast: Optional[CastSchema] = None
    producer: Optional[ProducerSchema] = None
    showtimes: Optional[List[str]] = None

    @classmethod
    def from_movie(cls, movie: Movie) -> "MovieSchema":
        return cls(
            movie_id=movie.movie_id,
            poster=movie.poster,
            title=movie.title,
            mpaa_rating=movie.mpaa_rating,
            synopsis=movie.synopsis,
            genre=movie.genre,
            status=movie.status,
            trailer=movie.trailer,
            trailer_image=movie.trailer_image,
            reviews=movie.reviews,
            cast=CastSchema.from_movie(movie),
            producer=ProducerSchema.from_movie(movie),
            showtimes=[f"{st.show_date} {st.show_time}" for st in movie.showtimes],
        )

 