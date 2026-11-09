from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..Database import get_db
from ..schemas.Seat_schema import SeatMapSchema
from ..Services.showtime_service import ShowtimeError, get_showtime_seats

router = APIRouter(prefix="/showtimes", tags=["Showtimes"])


@router.get("/{showtime_id}/seats", response_model=SeatMapSchema)
def read_showtime_seats(showtime_id: int, db: Session = Depends(get_db)):
    try:
        return get_showtime_seats(db, showtime_id)
    except ShowtimeError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
