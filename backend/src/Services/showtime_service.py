from sqlalchemy import select, case
from sqlalchemy.orm import Session

from ..Models.Movie_Models import Movie, Showtime, TheaterHall
from ..schemas.Showtime_schema import ShowtimeSchema
from ..Models.Seat_Models import Seat, ShowSeat
from ..schemas.Seat_schema import SeatMapSchema, ShowSeatSchema


class ShowtimeError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_movie_showtimes(db: Session, movie_id: int) -> list[ShowtimeSchema]:
    movie = db.scalar(select(Movie.movie_id).where(Movie.movie_id == movie_id))
    if movie is None:
        raise ShowtimeError("Movie not found.", 404)

    rows = db.execute(
        select(
            Showtime.showtime_id,
            Showtime.movie_id,
            Showtime.hall_id,
            TheaterHall.hall_number,
            Showtime.show_date,
            Showtime.show_time,
        )
        .join(TheaterHall, Showtime.hall_id == TheaterHall.hall_id)
        .where(Showtime.movie_id == movie_id)
        .order_by(Showtime.show_date, Showtime.showtime_id)
    ).mappings().all()

    return [ShowtimeSchema.model_validate(row) for row in rows]


def get_showtime_seats(db: Session, showtime_id: int) -> SeatMapSchema:
    showing = db.execute(
        select(Showtime.showtime_id, Showtime.hall_id, TheaterHall.hall_number)
        .join(TheaterHall, Showtime.hall_id == TheaterHall.hall_id)
        .where(Showtime.showtime_id == showtime_id)
    ).mappings().one_or_none()
    if showing is None:
        raise ShowtimeError("Showtime not found.", 404)

    rows = db.execute(
        select(ShowSeat.show_seat_id, Seat.seat_id, Seat.seat_number,
               case((ShowSeat.status != "Available", ShowSeat.status),
                    (ShowSeat.draft_id.is_not(None), "Reserved"),
                    else_=ShowSeat.status).label("status"))
        .join(Seat, ShowSeat.seat_id == Seat.seat_id)
        .where(
            ShowSeat.showtime_id == showtime_id,
            Seat.hall_id == showing["hall_id"],
        )
        .order_by(Seat.seat_number)
    ).mappings().all()

    return SeatMapSchema(
        **showing,
        seats=[ShowSeatSchema.model_validate(row) for row in rows],
    )
