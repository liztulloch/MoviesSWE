"""
main.py

FastAPI app entrypoint. Run with:
    uvicorn main:app --reload    # when running from the `backend` folder
    uvicorn backend.main:app --reload  # if your PYTHONPATH includes the workspace root
    uvicorn src.main:app --reload  # when running from the `backend` package (recommended)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the router using the package layout under `src`.
from src.Routes.Movie_getters import router as movie_router
from src.Routes.Registration_routes import router as registration_router
from src.Routes.Profile_routes import router as profile_router
from src.Routes.Auth_routes import router as auth_router
from src.Routes.Showtime_routes import router as showtime_router
from src.Routes.Booking_routes import router as booking_router

app = FastAPI(title="Cinema Booking API", version="0.1.0")

# Loosen this to your actual frontend origin(s) before shipping anywhere real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movie_router)
app.include_router(registration_router)
app.include_router(profile_router)
app.include_router(auth_router)
app.include_router(showtime_router)
app.include_router(booking_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}