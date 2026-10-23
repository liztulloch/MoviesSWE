
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Models.User_Model import User
from ..schemas.Card_schema import CardRequest, SavedCardSchema
from ..Services.card_service import add_customer_card, remove_customer_card
from ..schemas.Profile_schema import (
    ProfileUpdateRequest,
    ProfileSchema,
    FavoriteMovieRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)


from ..Services.profile_service import (
    ProfileError,
    get_customer_profile,
    update_customer_profile,
    add_movie_to_favorite,
    remove_movie_from_favorite,
    change_password,
    reset_password,
    forgot_password
)

# To be implemented with authentication.
from ..dependencies.auth_dependency import get_authenticated_user_id


router = APIRouter(
    prefix="/user",
    tags=["Profile"],
)


@router.post("/cards", status_code=201, response_model=SavedCardSchema)
def add_card(
    data: CardRequest,
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return add_customer_card(db, user_id, data)
    except ProfileError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.delete("/cards/{card_id}")
def remove_card(
    card_id: int,
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return remove_customer_card(db, user_id, card_id)
    except ProfileError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/me", response_model=ProfileSchema)
def read_profile(
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return get_customer_profile(
            db,
            user_id,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.put("/me")
def edit_profile(
    data: ProfileUpdateRequest,
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return update_customer_profile(
            db,
            user_id,
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
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return change_password(
            db,
            user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.post("/forgot-password")
def request_password_reset(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        return forgot_password(db, data)

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.post("/reset-password")
def complete_password_reset(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        return reset_password(db, data)

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
            user_id,
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
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return remove_movie_from_favorite(
            db,
            user_id,
            data,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error
