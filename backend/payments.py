"""Payments: Stripe Checkout (test/live keys) with a demo-card fallback.

Without STRIPE_SECRET_KEY every call works in "demo" mode so the checkout flow
is fully usable in development and CI. With a key set, /payments/checkout
creates a real Stripe Checkout Session (hosted page, card entry handled by
Stripe) and /payments/verify confirms the result after the redirect.
"""
import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Order, User
from schemas import DemoPaySchema, OrderCreateSchema

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "all")  # Albanian Lek, 2 decimals
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8081")
STRIPE_API = "https://api.stripe.com/v1"

payments_router = APIRouter(prefix="/payments", tags=["payments"])


def stripe_enabled() -> bool:
    return bool(STRIPE_SECRET_KEY)


def _luhn_valid(number: str) -> bool:
    digits = [int(c) for c in number.replace(" ", "").replace("-", "") if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    parity = len(digits) % 2
    for i, digit in enumerate(digits):
        if i % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def _expiry_valid(exp: str) -> bool:
    try:
        month_s, year_s = exp.replace(" ", "").split("/")
        month, year = int(month_s), int(year_s)
    except (ValueError, AttributeError):
        return False
    if not 1 <= month <= 12:
        return False
    if year < 100:
        year += 2000
    now = datetime.utcnow()
    return (year, month) >= (now.year, now.month)


def _create_order(db: Session, payload, user: User, status: str, method: str) -> Order:
    order = Order(
        customer_name=payload.customer_name,
        address=payload.address,
        phone=payload.phone,
        total_price=payload.total_price,
        items=payload.items,
        status=status,
        user_id=user.id,
        payment_method=method,
        is_demo=True,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@payments_router.get("/config")
def payment_config():
    return {"mode": "stripe" if stripe_enabled() else "demo", "currency": STRIPE_CURRENCY}


@payments_router.post("/checkout")
def checkout(
    payload: OrderCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not stripe_enabled():
        return {"mode": "demo", "order_id": None}

    order = _create_order(db, payload, user, status="Awaiting payment", method="stripe")

    form = [
        ("mode", "payment"),
        ("success_url", f"{FRONTEND_URL}/?session_id={{CHECKOUT_SESSION_ID}}"),
        ("cancel_url", f"{FRONTEND_URL}/"),
        ("client_reference_id", str(order.id)),
        ("metadata[order_id]", str(order.id)),
        ("line_items[0][quantity]", "1"),
        ("line_items[0][price_data][currency]", STRIPE_CURRENCY),
        ("line_items[0][price_data][unit_amount]", str(payload.total_price * 100)),
        ("line_items[0][price_data][product_data][name]", f"Climax order #{order.id}"),
    ]
    try:
        response = httpx.post(
            f"{STRIPE_API}/checkout/sessions",
            headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"},
            data=form,
            timeout=20.0,
        )
    except httpx.HTTPError:
        order.status = "Payment failed"
        db.commit()
        raise HTTPException(status_code=502, detail="Payment gateway unreachable")

    if response.status_code != 200:
        order.status = "Payment failed"
        db.commit()
        detail = response.json().get("error", {}).get("message", "Stripe error")
        raise HTTPException(status_code=502, detail=detail)

    session = response.json()
    order.stripe_session_id = session["id"]
    db.commit()
    return {"mode": "stripe", "url": session["url"], "order_id": order.id}


@payments_router.post("/demo-pay")
def demo_pay(
    payload: DemoPaySchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    number = payload.card.number.replace(" ", "").replace("-", "")
    if not _luhn_valid(number):
        raise HTTPException(status_code=400, detail="Card number is invalid")
    if not _expiry_valid(payload.card.exp):
        raise HTTPException(status_code=400, detail="Card expiry is invalid")
    if not (3 <= len(payload.card.cvc.strip()) <= 4) or not payload.card.cvc.strip().isdigit():
        raise HTTPException(status_code=400, detail="Card CVC is invalid")

    order = _create_order(db, payload, user, status="Paid", method="demo")
    return {"status": "success", "mode": "demo", "order_id": order.id}


@payments_router.get("/verify")
def verify(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not stripe_enabled():
        raise HTTPException(status_code=400, detail="Stripe is not configured")

    order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        response = httpx.get(
            f"{STRIPE_API}/checkout/sessions/{session_id}",
            headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"},
            timeout=20.0,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Payment gateway unreachable")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify payment")

    session = response.json()
    paid = session.get("payment_status") == "paid"
    if paid and order.status != "Paid":
        order.status = "Paid"
        db.commit()
    return {
        "status": "Paid" if paid else "Awaiting payment",
        "paid": paid,
        "order_id": order.id,
    }
