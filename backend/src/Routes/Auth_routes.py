from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..dependencies.auth_dependency import get_current_session
from ..Models.Session_Model import UserSession


from ..schemas.Auth_schemas import LoginRequest, LoginResponse
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
    login_session: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    try:
        db.execute(
            delete(UserSession).where(
                UserSession.session_id == login_session.session_id
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Logged out successfully."
    }
