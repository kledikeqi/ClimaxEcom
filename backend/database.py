import os
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

# DATABASE_URL lets the same code run on SQLite (default, zero-config) and
# PostgreSQL (docker-compose / CI / production) without any other changes.
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'climax.db'}")

_is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    **({"connect_args": {"check_same_thread": False}} if _is_sqlite else {}),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Columns added after the tables were first created. Existing SQLite files get
# the columns appended at startup; new databases (SQLite or Postgres) are built
# straight from the models, so these statements only ever fire on old data.
SCHEMA_MIGRATIONS = {
    "orders": {
        "created_at": {"sqlite": "ALTER TABLE orders ADD COLUMN created_at TIMESTAMP",
                       "postgresql": "ALTER TABLE orders ADD COLUMN created_at TIMESTAMP"},
        "is_demo": {"sqlite": "ALTER TABLE orders ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT 0",
                    "postgresql": "ALTER TABLE orders ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE"},
        "user_id": {"sqlite": "ALTER TABLE orders ADD COLUMN user_id INTEGER",
                    "postgresql": "ALTER TABLE orders ADD COLUMN user_id INTEGER"},
        "payment_method": {"sqlite": "ALTER TABLE orders ADD COLUMN payment_method VARCHAR",
                           "postgresql": "ALTER TABLE orders ADD COLUMN payment_method VARCHAR"},
        "stripe_session_id": {"sqlite": "ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR",
                              "postgresql": "ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR"},
    },
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _existing_columns(conn, table: str) -> set:
    if conn.dialect.name == "sqlite":
        return {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
    rows = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :table AND table_schema = current_schema()"
        ),
        {"table": table},
    )
    return {row[0] for row in rows}


def run_migrations() -> None:
    with engine.begin() as conn:
        dialect = conn.dialect.name
        for table, columns in SCHEMA_MIGRATIONS.items():
            existing = _existing_columns(conn, table)
            for name, variants in columns.items():
                if name not in existing:
                    conn.execute(text(variants[dialect]))
        conn.execute(
            text(
                "UPDATE orders SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)"
            )
        )
