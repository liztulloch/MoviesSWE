import hashlib
import secrets
from decimal import Decimal

from sqlalchemy import select, update, or_
from sqlalchemy.orm import Session, selectinload

from ..Models.Booking_Models import BookingDraft, TicketPrice
from ..Models.Customer_Models import Customer
from ..Models.Movie_Models import Showtime
from ..Models.Seat_Models import Seat, ShowSeat
from ..schemas.Booking_schema import (
    BookingDraftRequest, BookingDraftResponse, BookingDraftCreatedResponse,
    BookingDraftUpdateRequest, CheckoutSeat, CheckoutTicketLine, CheckoutSummary,
    CheckoutEmailResponse,
)


class BookingError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def draft_response(draft: BookingDraft) -> BookingDraftResponse:
    return BookingDraftResponse(
        draft_id=draft.draft_id, showtime_id=draft.showtime_id,
        adult=draft.adult, child=draft.child, senior=draft.senior,
        total_tickets=draft.adult + draft.child + draft.senior,
        selected_show_seat_ids=sorted(seat.show_seat_id for seat in draft.show_seats),
    )


def require_active_customer(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None or customer.status != "Active":
        raise BookingError("An active customer account is required.", 403)
    return customer


def create_booking_draft(
    db: Session, data: BookingDraftRequest, customer_id: int | None = None,
) -> BookingDraftCreatedResponse:
    try:
        if customer_id is not None:
            require_active_customer(db, customer_id)
        if db.scalar(select(Showtime.showtime_id).where(Showtime.showtime_id == data.showtime_id)) is None:
            raise BookingError("Showtime not found.", 404)
        token = secrets.token_urlsafe(32) if customer_id is None else None
        draft = BookingDraft(
            showtime_id=data.showtime_id, customer_id=customer_id,
            adult=data.adult, child=data.child, senior=data.senior,
            access_token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest() if token else None,
        )
        db.add(draft)
        db.flush()
        assign_booking_seats(db, draft, data.show_seat_ids)
        response = BookingDraftCreatedResponse(**draft_response(draft).model_dump(), access_token=token)
        db.commit()
        return response
    except Exception:
        db.rollback()
        raise


def require_booking_draft(
    db: Session, draft_id: int, token: str | None, *,
    lock: bool = False, customer_id: int | None = None,
) -> BookingDraft:
    draft = db.get(BookingDraft, draft_id, with_for_update=lock)
    if draft is None:
        raise BookingError("Booking draft not found or access denied.", 404)

    if draft.customer_id is not None:
        if draft.customer_id != customer_id:
            raise BookingError("Booking draft not found or access denied.", 404)
        require_active_customer(db, customer_id)
        return draft

    if not token:
        raise BookingError("A valid booking access token is required.", 403)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    if draft.access_token_hash is None or not secrets.compare_digest(draft.access_token_hash, token_hash):
        raise BookingError("Booking draft not found or access denied.", 404)
    return draft


def list_customer_booking_drafts(db: Session, customer_id: int) -> list[BookingDraftResponse]:
    require_active_customer(db, customer_id)
    drafts = db.scalars(
        select(BookingDraft)
        .where(BookingDraft.customer_id == customer_id)
        .options(selectinload(BookingDraft.show_seats))
        .order_by(BookingDraft.draft_id.desc())
    ).all()
    return [draft_response(draft) for draft in drafts]


def get_booking_draft(
    db: Session, draft_id: int, token: str | None, customer_id: int | None = None,
) -> BookingDraftResponse:
    return draft_response(require_booking_draft(db, draft_id, token, customer_id=customer_id))


def update_booking_draft(
    db: Session, draft_id: int, token: str | None, data: BookingDraftUpdateRequest,
    customer_id: int | None = None,
) -> BookingDraftResponse:
    try:
        draft = require_booking_draft(db, draft_id, token, lock=True, customer_id=customer_id)
        draft.adult = data.adult
        draft.child = data.child
        draft.senior = data.senior
        assign_booking_seats(db, draft, data.show_seat_ids)
        response = draft_response(draft)
        db.commit()
        return response
    except Exception:
        db.rollback()
        raise



def cancel_booking_draft(
    db: Session, draft_id: int, token: str | None, customer_id: int | None = None,
) -> None:
    try:
        draft = require_booking_draft(db, draft_id, token, lock=True, customer_id=customer_id)
        # The ShowSeat foreign key clears draft_id when the draft is deleted.
        db.delete(draft)
        db.commit()
    except Exception:
        db.rollback()
        raise


def assign_booking_seats(db: Session, draft: BookingDraft, selected_ids: list[int]) -> None:
    # The caller commits the draft and seat assignments together.
    seat_ids = sorted(selected_ids)
    if len(seat_ids) != draft.adult + draft.child + draft.senior:
        raise BookingError("Select exactly one seat for each ticket.", 400)
    showing = db.get(Showtime, draft.showtime_id)
    if showing is None:
        raise BookingError("Showtime not found.", 404)
    valid_ids = db.scalars(
        select(ShowSeat.show_seat_id)
        .join(Seat, ShowSeat.seat_id == Seat.seat_id)
        .where(ShowSeat.show_seat_id.in_(seat_ids),
               ShowSeat.showtime_id == draft.showtime_id,
               Seat.hall_id == showing.hall_id)
    ).all()
    if len(valid_ids) != len(seat_ids):
        raise BookingError("Every seat must belong to this showing and hall.", 400)

    # Conditional writes prevent overwriting another draft's reservation.
    claimed = db.execute(
        update(ShowSeat).where(
            ShowSeat.show_seat_id.in_(seat_ids),
            ShowSeat.status == "Available",
            or_(ShowSeat.draft_id.is_(None), ShowSeat.draft_id == draft.draft_id),
        ).values(draft_id=draft.draft_id).execution_options(synchronize_session=False)
    )
    if claimed.rowcount != len(seat_ids):
        raise BookingError("A selected seat is booked or reserved. Please choose another.", 409)
    db.execute(
        update(ShowSeat).where(ShowSeat.draft_id == draft.draft_id,
                              ShowSeat.show_seat_id.not_in(seat_ids))
        .values(draft_id=None).execution_options(synchronize_session=False)
    )
    db.expire(draft, ["show_seats"])


def checkout_booking_draft(
    db: Session, draft_id: int, token: str | None, customer_id: int,
) -> CheckoutSummary:
    try:
        customer = require_active_customer(db, customer_id)
        draft = require_booking_draft(db, draft_id, token, lock=True, customer_id=customer_id)
        showing = draft.showtime

        rows = db.execute(
            select(ShowSeat.show_seat_id, Seat.seat_number)
            .join(Seat, Seat.seat_id == ShowSeat.seat_id)
            .where(
                ShowSeat.draft_id == draft_id,
                ShowSeat.showtime_id == showing.showtime_id,
                Seat.hall_id == showing.hall_id,
                ShowSeat.status == "Available",
            )
            .order_by(Seat.seat_number)
            .with_for_update()
        ).mappings().all()
        quantities = {"Adult": draft.adult, "Child": draft.child, "Senior": draft.senior}
        ticket_count = sum(quantities.values())
        if ticket_count <= 0 or len(rows) != ticket_count:
            raise BookingError("The seat selection is no longer valid. Please choose your seats again.", 409)

        prices = dict(db.execute(select(TicketPrice.ticket_type, TicketPrice.price)).all())
        tickets = []
        for ticket_type, quantity in quantities.items():
            if not quantity:
                continue
            unit_price = prices.get(ticket_type)
            if unit_price is None:
                raise BookingError(f"The {ticket_type.lower()} ticket price is not configured.", 503)
            tickets.append(CheckoutTicketLine(
                ticket_type=ticket_type, quantity=quantity,
                unit_price=unit_price, line_total=unit_price * quantity,
            ))

        summary = CheckoutSummary(
            draft_id=draft.draft_id, movie_title=showing.movie.title,
            showtime_id=showing.showtime_id, show_date=showing.show_date,
            show_time=showing.show_time, hall_number=showing.hall.hall_number,
            seats=[CheckoutSeat.model_validate(row) for row in rows], tickets=tickets,
            subtotal_before_tax=sum((line.line_total for line in tickets), Decimal("0.00")),
            account_email=customer.user.email, checkout_email=draft.checkout_email,
        )
        draft.customer_id = customer_id
        draft.access_token_hash = None
        db.commit()
        return summary
    except Exception:
        db.rollback()
        raise


def confirm_checkout_email(
    db: Session, draft_id: int, customer_id: int, email: str,
) -> CheckoutEmailResponse:
    try:
        require_active_customer(db, customer_id)
        draft = db.scalar(
            select(BookingDraft)
            .where(BookingDraft.draft_id == draft_id, BookingDraft.customer_id == customer_id)
            .with_for_update()
        )
        if draft is None:
            raise BookingError("Booking draft not found or access denied.", 404)

        draft.checkout_email = email
        response = CheckoutEmailResponse(draft_id=draft.draft_id, checkout_email=email)
        db.commit()
        return response
    except Exception:
        db.rollback()
        raise
