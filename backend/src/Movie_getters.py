"""""
movie_getters.py
 
Query functions for pulling Movie rows from the database, filtered by status.
"""
 
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

 
def get_movies_by_name(name: str) -> List[dict]:
    """
    Return movies whose title contains the given text (case-insensitive,
    partial word match). E.g. search_movies_by_name("spider") matches
    "Spider-Man", "The Amazing Spider-Man", etc.
    """
    with SessionLocal() as session:
        query = session.query(Movie).filter(Movie.title.ilike(f"%{name}%"))
        return _to_list(query.all())
 
 
 
if __name__ == "__main__":
    print("Out Now:", get_out_now_movies("Action"))
    print("Coming Soon:", get_coming_soon_movies("Action"))
    #print("Spider Movies:", get_movies_by_name("spider"))