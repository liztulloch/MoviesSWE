
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Models.User_Model import User
from ..Schemas.Profile_schema import (
    ProfileUpdateRequest,
    ProfileSchema,
    FavoriteMovieRequest,
    ChangePasswordRequest
)


from ..Services.profile_service import (
    ProfileError,
    get_customer_profile,
    update_customer_profile,
    add_movie_to_favorite,
    remove_movie_from_favorite,
    change_password
)

# To be implemented with authentication.
from ..dependencies.auth_dependency import get_authenticated_user_id


router = APIRouter(
    prefix="/user",
    tags=["Profile"],
)


@router.get("/me", response_model=ProfileSchema)
def read_profile(
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return get_customer_profile(
            db,
            get_authenticated_user_id.user_id,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.put("/me")
def edit_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return update_customer_profile(
            db,
            current_user.user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.put("/change-password")
def change_my_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return change_password(
            db,
            current_user.user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error

@router.post("/favorite-movie")
def add_fav(
    data: FavoriteMovieRequest,
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return add_movie_to_favorite(
            db,
            current_user.user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error

@router.delete("/favorite-movie")
def remove_fav(
    data: FavoriteMovieRequest,
    current_user: User = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return remove_movie_from_favorite(
            db,
            current_user.user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error
