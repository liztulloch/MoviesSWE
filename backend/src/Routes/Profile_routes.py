'''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Models.User_Models import User
from ..schemas.Customer_schema import (
    CustomerSchema,
    CustomerUpdateRequest,
)
from ..Services.profile_service import (
    ProfileError,
    get_customer_profile,
    update_customer_profile,
)

# To be implemented with authentication.
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Profile"],
)


@router.get("/me", response_model=CustomerSchema)
def read_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_customer_profile(
            db,
            current_user.user_id,
        )

    except ProfileError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.put("/me")
def edit_profile(
    data: CustomerUpdateRequest,
    current_user: User = Depends(get_current_user),
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
'''