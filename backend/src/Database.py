"""
database.py

Engine, session factory, and the `get_db` FastAPI dependency. Every route
gets a fresh session per-request and it's closed automatically after.
"""

import os

from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
load_dotenv() 

# Point this at your real MySQL instance via env var. Falls back to a local
# default so the app is at least importable without one set.
#   mysql+pymysql://<user>:<password>@<host>:3306/cinema_booking
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/cinema_booking",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()