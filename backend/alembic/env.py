"""Alembic environment for MediScribe AI.

This file wires Alembic to the same SQLAlchemy metadata used by the FastAPI app.
The database URL comes from `DATABASE_URL`, so local development, Docker, and
deployment can all use the same migration command without hardcoded credentials.
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', '.env'))

from database import Base
import models  # noqa: F401 — registers User, Transcription, MedicalEntity, SoapNote

config = context.config

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Alembic needs it to connect to the database."
    )
config.set_main_option("sqlalchemy.url", database_url)

# Standard logging setup from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is the metadata object that autogenerate compares against the database.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
