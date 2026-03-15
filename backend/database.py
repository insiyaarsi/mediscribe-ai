# database.py
# SQLAlchemy engine setup and session factory.
#
# Why SessionLocal and get_db()?
# FastAPI uses dependency injection for database sessions. get_db() is a
# generator that yields one session per request and guarantees it is closed
# when the request finishes — even if an exception occurs. This prevents
# connection leaks under load.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# DATABASE_URL is read from the environment.
# In development (docker-compose), it is set in .env.
# In production (Railway), Railway injects it automatically when you attach
# a PostgreSQL plugin — the variable name Railway uses is DATABASE_URL.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Add it to your .env file for local development."
    )

# connect_args is only needed for SQLite (not used here, but left as a comment
# for reference). For PostgreSQL, no extra connect args are needed.
engine = create_engine(DATABASE_URL)

# Each instance of SessionLocal is one database session.
# autocommit=False means we control transactions explicitly (commit/rollback).
# autoflush=False means changes are not written to the DB until we call commit.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all ORM models inherit from.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency. Yields a database session for the duration of one
    request, then closes it regardless of success or failure.

    Usage in a route:
        from database import get_db
        from sqlalchemy.orm import Session
        from fastapi import Depends

        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()