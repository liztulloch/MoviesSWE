from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..Schemas.Registration_schema import (
    RegistrationRequest,
    ResendVerificationRequest,
    VerificationRequest,
)
from ..Services.registration_service import (
    RegistrationError,
    register_user,
    resend_verification,
    verify_email,
)


router = APIRouter(
    prefix="/reg",
    tags=["Registration"],
)


@router.post("/register", status_code=201)
def register(
    data: RegistrationRequest,
    db: Session = Depends(get_db),
):
    try:
        return register_user(db, data)

    except RegistrationError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.post("/verify-email")
def verify_registration(
    data: VerificationRequest,
    db: Session = Depends(get_db),
):
    try:
        return verify_email(
            db,
            str(data.email),
            data.code,
        )

    except RegistrationError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error


@router.post("/resend-verification")
def resend_registration_code(
    data: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    try:
        return resend_verification(
            db,
            str(data.email),
        )

    except RegistrationError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error