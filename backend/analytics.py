"""Pandas-powered analytics layer.

Every endpoint answers one question the shop owner (or a Power BI report)
would ask about the store: how much did we sell, what sells, what is running
out and how sales evolve over time.
"""

import io
import json
from datetime import datetime, timedelta
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

import models
from database import get_db
from seed import price_to_lek

router = APIRouter(prefix="/analytics", tags=["analytics"])

LOW_STOCK_THRESHOLD = 5

ORDER_COLUMNS = ["order_id", "created_at", "customer", "phone", "address",
                 "status", "total", "items", "is_demo"]
ITEM_COLUMNS = ["order_id", "created_at", "product_id", "product_name", "category",
                "size", "quantity", "unit_price", "line_total", "customer",
                "status", "is_demo"]


def _records(df: pd.DataFrame) -> List[dict]:
    """DataFrame -> JSON-safe list of native Python types."""
    return json.loads(df.to_json(orient="records"))


def _orders_frame(db: Session) -> pd.DataFrame:
    rows = [{
        "order_id": order.id,
        "created_at": order.created_at,
        "customer": order.customer_name,
        "phone": order.phone,
        "address": order.address,
        "status": order.status,
        "total": order.total_price,
        "items": order.items,
        "is_demo": bool(order.is_demo),
    } for order in db.query(models.Order).all()]

    df = pd.DataFrame(rows, columns=ORDER_COLUMNS)
    if df.empty:
        return df
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
    df["total"] = pd.to_numeric(df["total"], errors="coerce").fillna(0)
    return df.dropna(subset=["created_at"])


def _line_items_frame(db: Session) -> pd.DataFrame:
    """Explode order carts into an analytical fact table (one row per item)."""
    orders = _orders_frame(db)
    catalogue = {product.id: product for product in db.query(models.Product).all()}

    rows = []
    for _, order in orders.iterrows():
        for item in (order["items"] or []):
            product_id = item.get("product_id") or item.get("id")
            product = catalogue.get(product_id)
            unit_price = item.get("unit_price") or price_to_lek(item.get("price", ""))
            rows.append({
                "order_id": order["order_id"],
                "created_at": order["created_at"],
                "product_id": product_id,
                "product_name": item.get("name") or (product.name if product else "Unknown"),
                "category": item.get("category") or (product.category if product else "Unknown"),
                "size": item.get("size") or item.get("selectedSize") or "",
                "quantity": item.get("qty", 1) or 1,
                "unit_price": unit_price,
                "customer": order["customer"],
                "status": order["status"],
                "is_demo": order["is_demo"],
            })

    df = pd.DataFrame(rows, columns=ITEM_COLUMNS)
    if df.empty:
        return df
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1).astype(int)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0).astype(int)
    df["line_total"] = df["unit_price"] * df["quantity"]
    return df


def _growth(current: float, previous: float) -> Optional[float]:
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


@router.get("/summary")
def summary(db: Session = Depends(get_db)) -> dict:
    orders = _orders_frame(db)
    items = _line_items_frame(db)
    now = datetime.utcnow()

    revenue = int(orders["total"].sum()) if not orders.empty else 0
    order_count = int(len(orders))
    units_sold = int(items["quantity"].sum()) if not items.empty else 0
    customers = int(orders["phone"].nunique()) if not orders.empty else 0

    week = orders[orders["created_at"] >= now - timedelta(days=7)] if not orders.empty else orders
    previous_week = orders[(orders["created_at"] >= now - timedelta(days=14)) &
                           (orders["created_at"] < now - timedelta(days=7))] if not orders.empty else orders
    revenue_7d = int(week["total"].sum()) if not week.empty else 0
    revenue_prev_7d = int(previous_week["total"].sum()) if not previous_week.empty else 0

    if items.empty:
        top_category = None
    else:
        by_category = items.groupby("category")["line_total"].sum()
        top_category = str(by_category.idxmax()) if not by_category.empty else None

    low_stock, inventory_value = 0, 0
    for product in db.query(models.Product).all():
        unit = price_to_lek(product.price)
        inventory_value += unit * product.stock
        if product.stock <= LOW_STOCK_THRESHOLD:
            low_stock += 1

    return {
        "total_revenue": revenue,
        "total_orders": order_count,
        "average_order_value": int(revenue / order_count) if order_count else 0,
        "units_sold": units_sold,
        "unique_customers": customers,
        "revenue_last_7d": revenue_7d,
        "revenue_previous_7d": revenue_prev_7d,
        "revenue_growth_pct": _growth(revenue_7d, revenue_prev_7d),
        "orders_last_7d": int(len(week)),
        "top_category": top_category,
        "low_stock_products": low_stock,
        "inventory_value": inventory_value,
        "has_demo_data": bool(orders["is_demo"].any()) if not orders.empty else False,
        "generated_at": now.isoformat(timespec="seconds"),
    }


@router.get("/sales-timeline")
def sales_timeline(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
) -> dict:
    orders = _orders_frame(db)
    items = _line_items_frame(db)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - timedelta(days=days - 1)

    if not orders.empty:
        daily_orders = (
            orders[orders["created_at"] >= start]
            .groupby(orders["created_at"].dt.normalize())
            .size()
            .rename("orders")
        )
    else:
        daily_orders = pd.Series(dtype="int64", name="orders")

    if not items.empty:
        daily_revenue = (
            items[items["created_at"] >= start]
            .groupby(items["created_at"].dt.normalize())["line_total"]
            .sum()
            .rename("revenue")
        )
    else:
        daily_revenue = pd.Series(dtype="int64", name="revenue")

    frame = pd.concat([daily_revenue, daily_orders], axis=1).reindex(
        pd.date_range(start=start, end=today, freq="D")
    )
    frame = frame.fillna(0)
    frame["date"] = frame.index.strftime("%Y-%m-%d")
    frame["revenue"] = frame["revenue"].astype(int)
    frame["orders"] = frame["orders"].astype(int)

    return {"days": days, "points": _records(frame[["date", "revenue", "orders"]])}


@router.get("/revenue-by-category")
def revenue_by_category(db: Session = Depends(get_db)) -> List[dict]:
    items = _line_items_frame(db)
    if items.empty:
        return []
    grouped = (
        items.groupby("category")
        .agg(revenue=("line_total", "sum"), units=("quantity", "sum"),
             orders=("order_id", "nunique"))
        .reset_index()
        .sort_values("revenue", ascending=False)
    )
    grouped["revenue"] = grouped["revenue"].astype(int)
    grouped["units"] = grouped["units"].astype(int)
    grouped["orders"] = grouped["orders"].astype(int)
    grouped["share_pct"] = (grouped["revenue"] / grouped["revenue"].sum() * 100).round(1)
    return _records(grouped)


@router.get("/top-products")
def top_products(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[dict]:
    items = _line_items_frame(db)
    if items.empty:
        return []
    grouped = (
        items.groupby(["product_id", "product_name"])
        .agg(units=("quantity", "sum"), revenue=("line_total", "sum"),
             orders=("order_id", "nunique"))
        .reset_index()
        .sort_values("revenue", ascending=False)
        .head(limit)
    )
    grouped["revenue"] = grouped["revenue"].astype(int)
    grouped["units"] = grouped["units"].astype(int)
    grouped["orders"] = grouped["orders"].astype(int)
    return _records(grouped.rename(columns={"product_name": "name"}))


@router.get("/stock-alerts")
def stock_alerts(db: Session = Depends(get_db)) -> List[dict]:
    items = _line_items_frame(db)
    sold = (
        items.groupby("product_id")["quantity"].sum().astype(int)
        if not items.empty else pd.Series(dtype="int64")
    )
    alerts = []
    for product in db.query(models.Product).order_by(models.Product.stock).all():
        if product.stock > LOW_STOCK_THRESHOLD:
            continue
        alerts.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "price": product.price,
            "stock": product.stock,
            "units_sold": int(sold.get(product.id, 0)),
        })
    return alerts


def _fact_frame(db: Session) -> pd.DataFrame:
    items = _line_items_frame(db)
    if items.empty:
        return pd.DataFrame(columns=ITEM_COLUMNS + ["order_total"])
    orders = _orders_frame(db)[["order_id", "total"]].rename(columns={"total": "order_total"})
    fact = items.merge(orders, on="order_id", how="left")
    fact["order_date"] = fact["created_at"].dt.strftime("%Y-%m-%d %H:%M")
    fact["order_total"] = fact["order_total"].astype(int)
    return fact[[
        "order_id", "order_date", "customer", "status", "is_demo",
        "product_id", "product_name", "category", "size",
        "quantity", "unit_price", "line_total", "order_total",
    ]]


def _csv_response(frame: pd.DataFrame, filename: str) -> Response:
    buffer = io.StringIO()
    frame.to_csv(buffer, index=False)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/orders.csv")
def export_orders(db: Session = Depends(get_db)) -> Response:
    """Flat, Power BI ready fact table: one row per purchased item."""
    return _csv_response(_fact_frame(db), "climax_orders.csv")


@router.get("/export/products.csv")
def export_products(db: Session = Depends(get_db)) -> Response:
    """Product dimension table for the Power BI star schema."""
    frame = pd.DataFrame([{
        "product_id": product.id,
        "product_name": product.name,
        "category": product.category,
        "price_lek": price_to_lek(product.price),
        "stock": product.stock,
        "badge": product.badge or "",
    } for product in db.query(models.Product).all()])
    return _csv_response(frame, "climax_products.csv")
