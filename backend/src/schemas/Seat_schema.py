from pydantic import BaseModel, Field


class ShowSeatSchema(BaseModel):
    show_seat_id: int
    seat_id: int
    seat_number: int
    status: str


class SeatMapSchema(BaseModel):
    showtime_id: int
    hall_id: int
    hall_number: int
    seats: list[ShowSeatSchema] = Field(default_factory=list)
