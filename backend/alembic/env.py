# alembic/env.py
#
# Why this file exists and what it does:
# Alembic needs to know two things to generate and run migrations:
#   1. Where is the database? (connection URL)
#   2. What is the schema? (SQLAlchemy metadata)
#
# This file wires both of those together. It runs in two modes:
#   - offline: generates SQL scripts without connecting (useful for review)
#   - online: connects to the database and applies migrations directly
#
# Why we import Base from models rather than using the default empty metadata:
# Without the metadata, autogenerate would produce an empty migration.
# By importing Base (which all models inherit from), Alembic can inspect
# the full schema and generate the correct CREATE TABLE statements.

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# --- PATH SETUP ---
# Add the backend/ directory to sys.path so that `from database import Base`
# and `from models import ...` resolve correctly when Alembic runs from
# within the backend/alembic/ subdirectory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- LOAD ENVIRONMENT VARIABLES ---
# load_dotenv must come before any local imports that read os.getenv,
# including database.py which reads DATABASE_URL at import time.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', '.env'))

# --- IMPORT MODELS AND BASE ---
# Importing models registers all ORM classes against Base.metadata.
# Alembic's autogenerate compares Base.metadata against the live database
# to determine what SQL to emit. If you add new models in future weeks,
# import them here so autogenerate picks them up.
from database import Base
import models  # noqa: F401 — registers User, Transcription, MedicalEntity, SoapNote

# --- ALEMBIC CONFIG ---
config = context.config

# Override the sqlalchemy.url in alembic.ini with the environment variable.
# This is required so the same env.py works in local dev, CI, and Railway
# without hardcoding credentials anywhere.
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
    """
    Run migrations in offline mode.
    Generates SQL to stdout/file without connecting to the database.
    Useful for reviewing exactly what SQL will be executed before applying it.
    """
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
    """
    Run migrations in online mode.
    Connects to the database and applies pending migrations directly.
    This is what Railway will call on each deploy via `alembic upgrade head`.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        # NullPool is correct for migration scripts: each migration opens
        # a connection, applies changes, and closes it. Connection pooling
        # adds no benefit here and can cause issues in short-lived processes.
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
```

---

**Step 3 — Edit alembic.ini**

Open `backend/alembic.ini`. Find this line:
```
sqlalchemy.url = driver://user:pass@localhost/dbname
```

Replace it with:
```
sqlalchemy.url =