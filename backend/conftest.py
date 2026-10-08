"""Test bootstrap.

DATABASE_URL must be set before any app module is imported, because
database.py creates the engine at import time. Tests default to a throwaway
SQLite file; CI points DATABASE_URL at a PostgreSQL service container instead.
"""
import os
import tempfile
from datetime import datetime, timedelta

_TMPDIR = tempfile.mkdtemp(prefix="climax-tests-")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TMPDIR}/climax-test.db")
os.environ.setdefault("DEMO_ORDERS", "0")
os.environ.setdefault("ADMIN_EMAIL", "admin@climax.store")
os.environ.setdefault("ADMIN_PASSWORD", "TestAdmin1!")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

import models
from database import Base, SessionLocal, engine, run_migrations
from main import app

Base.metadata.create_all(bind=engine)
run_migrations()


@pytest.fixture(autouse=True)
def db():
    """Fresh database state for every test: empty tables, seeded catalogue
    and admin account (the demo order history is disabled via DEMO_ORDERS=0)."""
    session = SessionLocal()
    if session.bind.dialect.name == "postgresql":
        # DELETE would not reset identity sequences, so ids would drift
        # between tests; TRUNCATE RESTART IDENTITY keeps them deterministic.
        session.execute(text("TRUNCATE orders, products, users RESTART IDENTITY CASCADE"))
    else:
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
    session.commit()
    yield session
    session.close()


@pytest.fixture()
def client(db):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def register(client):
    def _register(email="shopper@example.com", password="SuperSecret1", full_name="Shopper"):
        response = client.post(
            "/auth/register",
            json={"email": email, "password": password, "full_name": full_name},
        )
        assert response.status_code == 201, response.text
        body = response.json()
        return {"Authorization": f"Bearer {body['access_token']}"}

    return _register


@pytest.fixture()
def admin_headers(client):
    response = client.post(
        "/auth/login",
        json={"email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"]},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def make_order(
    db,
    *,
    total: int = 6200,
    items: list | None = None,
    days_ago: int = 0,
    status: str = "Delivered",
    phone: str = "+355 69 000 0000",
):
    if items is None:
        items = [{
            "product_id": 1,
            "name": "Cyber Hoodie (Black)",
            "category": "Hoodies",
            "price": "6,200 LEK",
            "unit_price": 6200,
            "size": "M",
            "qty": 1,
        }]
    order = models.Order(
        customer_name="Test Customer",
        address="Rr. Test 1, Tirana",
        phone=phone,
        total_price=total,
        items=items,
        status=status,
        created_at=datetime.utcnow() - timedelta(days=days_ago),
        is_demo=False,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
