"""""
movie_getters.py
 
Query functions for pulling Movie rows from the database, filtered by status.
"""
 
from datetime import datetime
from typing import List, Optional
 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
 
from schemas.movie_schema import Movie, MovieSchema

STATUS_OUT_NOW = "Out Now"
STATUS_COMING_SOON = "Coming Soon"
 
 
# ---------------------------------------------------------------------------
# DB session setup — update the connection string for your environment
# ---------------------------------------------------------------------------
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/cinema_booking"
 
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _to_list(movies: List[Movie]) -> List[dict]:
    """Convert ORM rows into a plain list of dicts (JSON-serializable array)."""
    return [MovieSchema.model_validate(m).model_dump() for m in movies]
 
 
 
# ---------------------------------------------------------------------------
# Getters
# ---------------------------------------------------------------------------
 

 ## filter by showdate logic will be added later 
def get_out_now_movies(genre: Optional[str] = None) -> List[dict]:
    """Return movies whose status is 'out now' as a list of dicts."""
    with SessionLocal() as session:
        query = session.query(Movie).filter(Movie.status == STATUS_OUT_NOW)
        if genre:
             query = query.filter(Movie.genre.ilike(f"%{genre}%"))
        movies = query.all()
        return _to_list(movies)
 
 
def get_coming_soon_movies(genre: Optional[str] = None) -> List[dict]:
    """Return movies whose status is 'coming soon' as a list of dicts."""
    with SessionLocal() as session:
        query = session.query(Movie).filter(Movie.status == STATUS_COMING_SOON)
        if genre:
             query = query.filter(Movie.genre.ilike(f"%{genre}%"))
        movies = query.all()
        return _to_list(movies)

 
def get_movies_by_name(name: str, genre: Optional[str] = None) -> List[dict]:
    """
    Return movies whose title contains the given text (case-insensitive,
    partial word match). E.g. search_movies_by_name("spider") matches
    "Spider-Man", "The Amazing Spider-Man", etc.

    Used in search bar for searching movies by name. Returns a list of dicts.
    includes get by genre filter as well. if genere is selected in drop down 

    """
    with SessionLocal() as session:
        query = session.query(Movie).filter(Movie.title.ilike(f"%{name}%"))
        if genre:
            query = query.filter(Movie.genre.ilike(f"%{genre}%"))
        return _to_list(query.all())
#  # n
# def get_universal_search_results( status: Optional[str] = None, name: Optional[str] = None, genre: Optional[str] = None, showtimes: Optional[datetime] = None) -> List[dict]:
#     """ot funtional yils show time is added 
#     Return movies whose title or genre contains the given text (case-insensitive,
#     partial word match). E.g. search_movies_by_name("spider") matches
#     "Spider-Man", "The Amazing Spider-Man", etc.


#     Universal search function that allows filtering by name, genre, and showtimes. Returns a list of dicts.
#     """
#     with SessionLocal() as session:
#         query = session.query(Movie)
#         if status:
#             query = query.filter(Movie.status == status)
#         if genre:
#              query = query.filter(Movie.genre.ilike(f"%{genre}%"))
#         if name:
#              query = query.filter(Movie.title.ilike(f"%{name}%"))
#         if showtimes:
#                 query = query.filter(Movie.showtimes.ilike(f"%{showtimes}%"))

#         movies = query.all()
#         return _to_list(movies)
 
if __name__ == "__main__":
    print("Out Now:", get_out_now_movies("Action"))
    print("Coming Soon:", get_coming_soon_movies("Action"))
    #print("Spider Movies:", get_movies_by_name("spider"))