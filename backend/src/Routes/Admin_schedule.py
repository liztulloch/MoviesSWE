"""
Admin showtime scheduling.  Save as: src/Routes/Admin_schedule.py

Register in main.py:
    from src.Routes.Admin_schedule import router as admin_schedule_router
    app.include_router(admin_schedule_router)

Flow (2 methods):
  1. GET  /admin/schedule/availability?movie_id=5&show_date=2026-11-24
        -> movie + the 3 halls, each with its open time slots for that day
  2. POST /admin/schedule/showtimes   {movie_id, hall_id, show_date, show_time}
        -> schedules the movie into the chosen open slot and updates the DB
           (Showtime row + one ShowSeat row per seat in that hall)

Uses raw SQL via text(), so no new SQLAlchemy models are needed.
"""
from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..Database import get_db

# Add your admin dependency here once you have one:
#   dependencies=[Depends(your_admin_dependency)]
router = APIRouter(prefix="/admin/schedule", tags=["Admin Schedule"])

# Must match the Showtime.show_time text format used in your seed data.
TIME_SLOTS = ["2:00 PM", "5:00 PM", "8:00 PM"]


# ---------- Schemas ----------
class MovieInfo(BaseModel):
    movie_id: int
    title: str
    status: str


class BookedSlot(BaseModel):
    show_time: str
    movie_title: str


class HallAvailability(BaseModel):
    hall_id: int
    hall_number: int
    available_times: List[str]
    booked: List[BookedSlot]


class AvailabilityOut(BaseModel):
    movie: MovieInfo
    show_date: date
    halls: List[HallAvailability]


class ScheduleIn(BaseModel):
    movie_id: int
    hall_id: int
    show_date: date
    show_time: str


class ScheduleOut(BaseModel):
    showtime_id: int
    movie_id: int
    hall_id: int
    show_date: date
    show_time: str
    seats_created: int


# ---------- Helpers ----------
def _slot_datetime(d: date, slot: str) -> datetime:
    return datetime.combine(d, datetime.strptime(slot, "%I:%M %p").time())


def _get_movie(db: Session, movie_id: int):
    movie = db.execute(
        text("SELECT movie_id, title, status FROM Movie WHERE movie_id = :id"),
        {"id": movie_id},
    ).mappings().first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


# ---------- Method 1: open slots per showroom for a movie + date ----------
@router.get("/availability", response_model=AvailabilityOut)
def get_available_slots(
    movie_id: int = Query(..., description="Movie the admin wants to schedule"),
    show_date: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    if show_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot schedule on a past date")

    movie = _get_movie(db, movie_id)

    halls = db.execute(
        text("SELECT hall_id, hall_number FROM TheaterHall ORDER BY hall_number")
    ).mappings().all()

    taken = db.execute(
        text(
            """
            SELECT s.hall_id, s.show_time, m.title
            FROM Showtime s
            JOIN Movie m ON m.movie_id = s.movie_id
            WHERE s.show_date = :d
            """
        ),
        {"d": show_date},
    ).mappings().all()
    taken_map = {(t["hall_id"], t["show_time"]): t["title"] for t in taken}

    now = datetime.now()
    result = []
    for h in halls:
        available, booked = [], []
        for slot in TIME_SLOTS:
            title = taken_map.get((h["hall_id"], slot))
            if title is not None:
                booked.append(BookedSlot(show_time=slot, movie_title=title))
            elif _slot_datetime(show_date, slot) > now:  # hide slots already past today
                available.append(slot)
        result.append(
            HallAvailability(
                hall_id=h["hall_id"],
                hall_number=h["hall_number"],
                available_times=available,
                booked=booked,
            )
        )

    return AvailabilityOut(
        movie=MovieInfo(**movie), show_date=show_date, halls=result
    )


# ---------- Method 2: schedule the movie into the chosen slot ----------
@router.post("/showtimes", response_model=ScheduleOut, status_code=201)
def schedule_showtime(payload: ScheduleIn, db: Session = Depends(get_db)):
    if payload.show_time not in TIME_SLOTS:
        raise HTTPException(status_code=400, detail=f"show_time must be one of {TIME_SLOTS}")
    if _slot_datetime(payload.show_date, payload.show_time) <= datetime.now():
        raise HTTPException(status_code=400, detail="Cannot schedule a showtime in the past")

    _get_movie(db, payload.movie_id)

    if not db.execute(
        text("SELECT 1 FROM TheaterHall WHERE hall_id = :id"), {"id": payload.hall_id}
    ).first():
        raise HTTPException(status_code=404, detail="Hall not found")

    # Slot must still be empty (re-checked here because availability may be stale)
    if db.execute(
        text(
            "SELECT 1 FROM Showtime "
            "WHERE hall_id = :h AND show_date = :d AND show_time = :t"
        ),
        {"h": payload.hall_id, "d": payload.show_date, "t": payload.show_time},
    ).first():
        raise HTTPException(status_code=409, detail="That time slot is already taken")

    try:
        res = db.execute(
            text(
                "INSERT INTO Showtime (movie_id, hall_id, show_date, show_time) "
                "VALUES (:m, :h, :d, :t)"
            ),
            {
                "m": payload.movie_id,
                "h": payload.hall_id,
                "d": payload.show_date,
                "t": payload.show_time,
            },
        )
        showtime_id = res.lastrowid

        # One ShowSeat per physical seat in the hall so the seat map works
        seats = db.execute(
            text(
                "INSERT INTO ShowSeat (status, seat_id, showtime_id) "
                "SELECT 'Available', seat_id, :sid FROM Seat WHERE hall_id = :h"
            ),
            {"sid": showtime_id, "h": payload.hall_id},
        )
        seats_created = seats.rowcount
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That time slot was just taken. Pick another.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to schedule showtime")

    return ScheduleOut(
        showtime_id=showtime_id,
        movie_id=payload.movie_id,
        hall_id=payload.hall_id,
        show_date=payload.show_date,
        show_time=payload.show_time,
        seats_created=seats_created,
    )
