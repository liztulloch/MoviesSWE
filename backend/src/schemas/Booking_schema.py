from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class SeatSelectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    show_seat_ids: list[Annotated[int, Field(gt=0, strict=True)]] = Field(min_length=1)

    @model_validator(mode="after")
    def reject_duplicates(self):
        if len(set(self.show_seat_ids)) != len(self.show_seat_ids):
            raise ValueError("Select each seat only once.")
        return self


class BookingDraftUpdateRequest(SeatSelectionRequest):
    adult: int = Field(default=0, ge=0, le=2147483647, strict=True)
    child: int = Field(default=0, ge=0, le=2147483647, strict=True)
    senior: int = Field(default=0, ge=0, le=2147483647, strict=True)

    @model_validator(mode="after")
    def require_tickets(self):
        if self.adult + self.child + self.senior == 0:
            raise ValueError("Select at least one ticket.")
        if len(self.show_seat_ids) != self.adult + self.child + self.senior:
            raise ValueError("Select exactly one seat for each ticket.")
        return self


class BookingDraftRequest(BookingDraftUpdateRequest):
    showtime_id: int = Field(gt=0, strict=True)


class BookingDraftResponse(BaseModel):
    draft_id: int
    showtime_id: int
    adult: int
    child: int
    senior: int
    total_tickets: int
    selected_show_seat_ids: list[int] = Field(default_factory=list)


class BookingDraftCreatedResponse(BookingDraftResponse):
    access_token: str | None = None


class CheckoutSeat(BaseModel):
    show_seat_id: int
    seat_number: int


class CheckoutTicketLine(BaseModel):
    ticket_type: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutSummary(BaseModel):
    draft_id: int
    movie_title: str
    showtime_id: int
    show_date: date
    show_time: str
    hall_number: int
    seats: list[CheckoutSeat]
    tickets: list[CheckoutTicketLine]
    subtotal_before_tax: Decimal
    account_email: str
    checkout_email: str | None = None


class CheckoutEmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    checkout_email: EmailStr = Field(max_length=254)


class CheckoutEmailResponse(BaseModel):
    draft_id: int
    checkout_email: str
