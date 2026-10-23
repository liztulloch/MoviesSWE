from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Dependencies.auth_dependency import get_authenticated_user_id


from ..Schemas.Auth_schemas import LoginRequest, LoginResponse
from ..Services.auth_service import AuthError, login_user
from ..Database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)




@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        return login_user(
            db=db,
            email=str(data.email),
            password=data.password.get_secret_value()
        )

    except AuthError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message
        ) from error



@router.post("/logout")
def logout(
    user_id: int = Depends(get_authenticated_user_id)
):
    return {
        "message": "Logged out successfully."
    }