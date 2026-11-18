from datetime import date

from pydantic import BaseModel


class ShowtimeSchema(BaseModel):
    showtime_id: int
    movie_id: int
    hall_id: int
    hall_number: int
    show_date: date
    show_time: str
