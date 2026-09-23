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
            cast.append(f"{name} as {mr.character_name}" if mr.character_name else name)
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

 
# from typing import List, Optional
 
# from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, UniqueConstraint
# from sqlalchemy.orm import declarative_base, relationship
 
# from pydantic import BaseModel, ConfigDict

# Base = declarative_base()
 
 
# # ---------------------------------------------------------------------------
# # ORM Model — mirrors the CREATE TABLE statement exactly
# # ---------------------------------------------------------------------------
# class Movie(Base):
#     __tablename__ = "Movie"
#     __table_args__ = {"schema": "cinema_booking"}
 
#     movie_id = Column(Integer, primary_key=True, autoincrement=True)
#     poster = Column(String(500), nullable=True)
#     title = Column(String(255), nullable=False)
#     mpaa_rating = Column(String(100), nullable=True)
#     synopsis = Column(Text, nullable=True)
#     genre = Column(String(100), nullable=True)
#     status = Column(String(50), nullable=False)
#     trailer = Column(String(500), nullable=True)
#     trailer_image = Column(String(500), nullable=True)
#     reviews = Column(String(500), nullable=True)  # Comma-separated list of reviews  


#     movie_roles = relationship(
#         "MovieRole",
#         back_populates="movie",
#         cascade="all, delete-orphan",
#     )
#      # One Movie -> many Showtime rows.
#     showtimes = relationship(
#         "Showtime",
#         back_populates="movie",
#         cascade="all, delete-orphan",
#     )
 
#     def __repr__(self) -> str:
#         return f"<Movie id={self.movie_id} title={self.title!r} status={self.status!r}>"
 
 
# class Person(Base):
#     __tablename__ = "Person"
#     __table_args__ = {"schema": "cinema_booking"}
 
#     person_id = Column(Integer, primary_key=True, autoincrement=True)
#     first_name = Column(String(100), nullable=False)
#     last_name = Column(String(100), nullable=False)
 
#     # One Person -> many MovieRole rows (their credits across movies).
#     movie_roles = relationship(
#         "MovieRole",
#         back_populates="person",
#         cascade="all, delete-orphan",
#     )
 
#     @property
#     def full_name(self) -> str:
#         return f"{self.first_name} {self.last_name}"
 
#     def __repr__(self) -> str:
#         return f"<Person id={self.person_id} name={self.full_name!r}>"

    
# class MovieRole(Base):
#     __tablename__ = "MovieRole"
#     __table_args__ = {"schema": "cinema_booking"}
 
#     movie_id = Column(
#         Integer, ForeignKey("cinema_booking.Movie.movie_id"), primary_key=True
#     )
#     person_id = Column(
#         Integer, ForeignKey("cinema_booking.Person.person_id"), primary_key=True
#     )
#     role = Column(String(50), nullable=False, primary_key=True)  # 'actor', 'producer', ...
#     character_name = Column(String(255), nullable=True)  # only meaningful for 'actor' rows
 
#     movie = relationship("Movie", back_populates="movie_roles")
#     person = relationship("Person", back_populates="movie_roles")
 
#     def __repr__(self) -> str:
#         return f"<MovieRole movie={self.movie_id} person={self.person_id} role={self.role!r}>"
 
 

# class Showtime(Base):
#     __tablename__ = "Showtime"
#     __table_args__ = (
#         UniqueConstraint("movie_id", "hall_id", "show_date", "show_time"),
#         {"schema": "cinema_booking"},
#     )
 
#     showtime_id = Column(Integer, primary_key=True, autoincrement=True)
#     movie_id = Column(
#         Integer, ForeignKey("cinema_booking.Movie.movie_id"), nullable=False
#     )
#     # TheaterHall isn't modeled in this file — send its DDL and I'll add the
#     # class + a `hall` relationship here.
#     hall_id = Column(
#         Integer, ForeignKey("cinema_booking.TheaterHall.hall_id"), nullable=False
#     )
#     show_date = Column(Date, nullable=False)
#     show_time = Column(String(10), nullable=False)
 
#     movie = relationship("Movie", back_populates="showtimes")
 
#     def __repr__(self) -> str:
#         return (
#             f"<Showtime id={self.showtime_id} movie={self.movie_id} "
#             f"date={self.show_date} time={self.show_time!r}>"
#         )
 
# # ---------------------------------------------------------------------------
# # Pydantic schema — for API responses / serialization
# # ---------------------------------------------------------------------------
# class ProducerSchema(BaseModel):
#     movie_id: int
#     producers: List[str] = []
 
#     @classmethod
#     def from_movie(cls, movie: Movie) -> "ProducerSchema":
#         producers = [
#             mr.person.full_name
#             for mr in movie.movie_roles
#             if mr.role.lower() == "producer"
#         ]
#         return cls(movie_id=movie.movie_id, producers=producers)
 
 

# class CastSchema(BaseModel):
#     movie_id: int
#     cast: List[str] = []
 
#     @classmethod
#     def from_movie(cls, movie: Movie) -> "CastSchema":
#         cast = []
#         for mr in movie.movie_roles:
#             if mr.role.lower() != "actor":
#                 continue
#             name = mr.person.full_name
#             # append the character they played, if one is recorded
#             cast.append(f"{name} as {mr.character_name}" if mr.character_name else name)
#         return cls(movie_id=movie.movie_id, cast=cast)
   
# class MovieSchema(BaseModel):
#     model_config = ConfigDict(from_attributes=True)
#     movie_id: int
#     poster: Optional[str] = None
#     title: str
#     mpaa_rating: Optional[str] = None
#     synopsis: Optional[str] = None
#     genre: Optional[str] = None
#     status: str
#     trailer: Optional[str] = None
#     trailer_image: Optional[str] = None
#     cast: Optional[CastSchema] = None
#     producer: Optional[ProducerSchema] = None    
#     reviews: Optional[str] = None
#     showtimes: Optional[List[str]] = None



#     @classmethod
#     def from_movie(cls, movie: Movie) -> "MovieSchema":
#         """
#         Build a MovieSchema straight from an ORM Movie instance, populating
#         `cast` / `producer` / `showtimes` from Movie's relationships instead
#         of relying on model_validate() to guess how to do it (it can't —
#         the shapes don't line up field-for-field).
#         """
#         return cls(
#             movie_id=movie.movie_id,
#             poster=movie.poster,
#             title=movie.title,
#             mpaa_rating=movie.mpaa_rating,
#             synopsis=movie.synopsis,
#             genre=movie.genre,
#             status=movie.status,
#             trailer=movie.trailer,
#             trailer_image=movie.trailer_image,
#             reviews=movie.reviews,
#             cast=CastSchema.from_movie(movie),
#             producer=ProducerSchema.from_movie(movie),
#             showtimes=[f"{st.show_date} {st.show_time}" for st in movie.showtimes],
#         )
 
    