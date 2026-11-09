from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..dependencies.auth_dependency import get_authenticated_user_id, get_current_session
from ..schemas.Booking_schema import (
    BookingDraftRequest, BookingDraftResponse, BookingDraftCreatedResponse,
    BookingDraftUpdateRequest, CheckoutEmailRequest, CheckoutEmailResponse, CheckoutSummary,
)
from ..Services.booking_service import (
    BookingError, checkout_booking_draft, confirm_checkout_email, create_booking_draft, get_booking_draft,
    list_customer_booking_drafts, update_booking_draft,
)

router = APIRouter(prefix="/booking-drafts", tags=["Booking"])



def get_optional_booking_user_id(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> int | None:
    if authorization is None:
        return None
    return get_current_session(authorization=authorization, db=db).user_id


@router.post("", status_code=201, response_model=BookingDraftCreatedResponse, response_model_exclude_none=True)
def start_booking(
    data: BookingDraftRequest,
    db: Session = Depends(get_db),
    user_id: int | None = Depends(get_optional_booking_user_id),
):
    try:
        return create_booking_draft(db, data, customer_id=user_id)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("", response_model=list[BookingDraftResponse])
def list_my_booking_drafts(
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return list_customer_booking_drafts(db, user_id)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/{draft_id}", response_model=BookingDraftResponse)
def read_booking(
    draft_id: int,
    booking_token: str | None = Header(default=None, alias="X-Booking-Token"),
    db: Session = Depends(get_db),
    user_id: int | None = Depends(get_optional_booking_user_id),
):
    try:
        return get_booking_draft(db, draft_id, booking_token, user_id)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.put("/{draft_id}", response_model=BookingDraftResponse)
def update_booking(
    draft_id: int,
    data: BookingDraftUpdateRequest,
    booking_token: str | None = Header(default=None, alias="X-Booking-Token"),
    db: Session = Depends(get_db),
    user_id: int | None = Depends(get_optional_booking_user_id),
):
    try:
        return update_booking_draft(db, draft_id, booking_token, data, user_id)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/{draft_id}/checkout", response_model=CheckoutSummary)
def checkout_booking(
    draft_id: int,
    booking_token: str | None = Header(default=None, alias="X-Booking-Token"),
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return checkout_booking_draft(db, draft_id, booking_token, user_id)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.put("/{draft_id}/email", response_model=CheckoutEmailResponse)
def update_checkout_email(
    draft_id: int,
    data: CheckoutEmailRequest,
    user_id: int = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    try:
        return confirm_checkout_email(db, draft_id, user_id, data.checkout_email)
    except BookingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
