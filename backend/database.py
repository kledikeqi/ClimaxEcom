from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'climax.db'}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Columns added after the tables were first created. SQLite cannot ALTER a
# column in place, so new columns are appended at startup if they are missing.
SCHEMA_MIGRATIONS = {
    "orders": {
        "created_at": "ALTER TABLE orders ADD COLUMN created_at DATETIME",
        "is_demo": "ALTER TABLE orders ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT 0",
    },
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations() -> None:
    with engine.begin() as conn:
        for table, columns in SCHEMA_MIGRATIONS.items():
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            for name, statement in columns.items():
                if name not in existing:
                    conn.execute(text(statement))
        conn.execute(
            text(
                "UPDATE orders SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)"
            )
        )
