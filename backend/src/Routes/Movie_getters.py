from typing import List, Optional

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session, selectinload

from ..Database import get_db
from ..Models.Movie_Models import Movie, MovieRole
from ..schemas.Movie_schema import MovieSchema


router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


STATUS_CR = "Currently Running"
STATUS_CS = "Coming Soon"


@router.get("/currently-running", response_model=List[MovieSchema])
def get_currently_running_movies(
    genre: Optional[str] = None,
    db: Session = Depends(get_db),
    response: Response = None,
):
    """
    Get all currently running movies.

    Optionally filter by genre.
    """

    query = db.query(Movie).filter(
        Movie.status == STATUS_CR
    )

    if genre:
        query = query.filter(
            Movie.genre.ilike(f"%{genre}%")
        )

    # Eager-load related objects so `from_movie()` can access them
    query = query.options(
        selectinload(Movie.movie_roles).selectinload(MovieRole.person),
        selectinload(Movie.showtimes),
    )

    movies = query.all()
    if not movies:
        if response is not None:
            response.headers["X-Message"] = "No movies found"
        return []
    return [MovieSchema.from_movie(m) for m in movies]


@router.get("/coming-soon", response_model=List[MovieSchema])
def get_coming_soon_movies(
    genre: Optional[str] = None,
    db: Session = Depends(get_db),
    response: Response = None,
):
    """
    Get all coming soon movies.

    Optionally filter by genre.
    """

    query = db.query(Movie).filter(
        Movie.status == STATUS_CS
    )

    if genre:
        query = query.filter(
            Movie.genre.ilike(f"%{genre}%")
        )

    # Eager-load related objects so `from_movie()` can access them
    query = query.options(
        selectinload(Movie.movie_roles).selectinload(MovieRole.person),
        selectinload(Movie.showtimes),
    )

    movies = query.all()
    if not movies:
        if response is not None:
            response.headers["X-Message"] = "No movies found"
        return []
    return [MovieSchema.from_movie(m) for m in movies]


@router.get("/search", response_model=List[MovieSchema])
def get_movies_by_name(
    name: str,
    genre: Optional[str] = None,
    db: Session = Depends(get_db),
    response: Response = None,
):
    """
    Search for movies by title.

    Optionally filter by genre.
    """

    query = db.query(Movie).filter(
        Movie.title.ilike(f"%{name}%")
    )

    if genre:
        query = query.filter(
            Movie.genre.ilike(f"%{genre}%")
        )

    # Eager-load related objects so `from_movie()` can access them
    query = query.options(
        selectinload(Movie.movie_roles).selectinload(MovieRole.person),
        selectinload(Movie.showtimes),
    )

    movies = query.all()
    if not movies:
        if response is not None:
            response.headers["X-Message"] = "No movies found"
        return []
    return [MovieSchema.from_movie(m) for m in movies]