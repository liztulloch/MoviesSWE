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
from src.Routes import router


app = FastAPI(title="Cinema Booking API", version="0.1.0")

# Loosen this to your actual frontend origin(s) before shipping anywhere real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}