from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Models.Movie_Models import Movie
from ..Schemas.Movie_schema import MovieCreate, MovieSchema

router = APIRouter(
    prefix="/admin/movies",
    tags=["Admin Movies"]
)


@router.post(
    "",
    response_model=MovieSchema,
    status_code=status.HTTP_201_CREATED
)
def add_movie(
    movie_data: MovieCreate,
    db: Session = Depends(get_db)
):

    # Prevent blank strings
    if not movie_data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Movie title cannot be empty"
        )

    if not movie_data.genre.strip():
        raise HTTPException(
            status_code=400,
            detail="Movie genre cannot be empty"
        )

    # Validate movie status
    valid_statuses = [
        "Currently Running",
        "Coming Soon"
    ]

    if movie_data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'Currently Running' or 'Coming Soon'"
        )

    # Check duplicate movie
    existing_movie = (
        db.query(Movie)
        .filter(Movie.title == movie_data.title.strip())
        .first()
    )

    if existing_movie:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Movie already exists"
        )

    # Create movie
    movie = Movie(
        title=movie_data.title.strip(),
        mpaa_rating=movie_data.mpaa_rating,
        synopsis=movie_data.synopsis,
        genre=movie_data.genre.strip(),
        status=movie_data.status,
        poster=movie_data.poster,
        trailer=movie_data.trailer,
        trailer_image=movie_data.trailer_image,
        reviews=movie_data.reviews
    )

    try:
        db.add(movie)
        db.commit()
        db.refresh(movie)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to add movie"
        )

    return MovieSchema.from_movie(movie)