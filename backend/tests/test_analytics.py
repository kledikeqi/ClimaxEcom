from conftest import make_order
from seed import CATALOGUE, price_to_lek


def test_summary_with_no_orders(client):
    response = client.get("/analytics/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["total_revenue"] == 0
    assert body["total_orders"] == 0
    assert body["average_order_value"] == 0
    assert body["units_sold"] == 0

    expected_low_stock = sum(1 for p in CATALOGUE if p["stock"] <= 5)
    assert body["low_stock_products"] == expected_low_stock
    expected_inventory = sum(price_to_lek(p["price"]) * p["stock"] for p in CATALOGUE)
    assert body["inventory_value"] == expected_inventory


def test_summary_totals_and_growth(client, db):
    make_order(db, total=6200, days_ago=1, phone="+355 69 111 1111")
    make_order(db, total=2500, days_ago=3, phone="+355 69 222 2222")
    make_order(db, total=8500, days_ago=10, phone="+355 69 111 1111")

    body = client.get("/analytics/summary").json()
    assert body["total_revenue"] == 6200 + 2500 + 8500
    assert body["total_orders"] == 3
    assert body["average_order_value"] == (6200 + 2500 + 8500) // 3
    assert body["revenue_last_7d"] == 6200 + 2500
    assert body["revenue_previous_7d"] == 8500
    assert body["revenue_growth_pct"] is not None
    assert body["orders_last_7d"] == 2
    assert body["unique_customers"] == 2


def test_revenue_by_category_ordering(client, db):
    hoodie = {
        "product_id": 1, "name": "Cyber Hoodie (Black)", "category": "Hoodies",
        "price": "6,200 LEK", "unit_price": 6200, "size": "M", "qty": 2,
    }
    chain = {
        "product_id": 6, "name": "Chrome Cross Chain", "category": "Jewelry",
        "price": "2,500 LEK", "unit_price": 2500, "size": "One Size", "qty": 1,
    }
    make_order(db, total=6200 * 2, items=[hoodie])
    make_order(db, total=2500, items=[dict(hoodie, qty=1), chain])

    rows = client.get("/analytics/revenue-by-category").json()
    assert [row["category"] for row in rows] == ["Hoodies", "Jewelry"]
    assert rows[0]["revenue"] == 6200 * 3
    assert rows[1]["revenue"] == 2500
    assert rows[0]["units"] == 3
    assert abs(sum(row["share_pct"] for row in rows) - 100.0) < 0.5


def test_top_products_by_revenue(client, db):
    chain = {
        "product_id": 6, "name": "Chrome Cross Chain", "category": "Jewelry",
        "price": "2,500 LEK", "unit_price": 2500, "size": "One Size", "qty": 4,
    }
    hoodie = {
        "product_id": 1, "name": "Cyber Hoodie (Black)", "category": "Hoodies",
        "price": "6,200 LEK", "unit_price": 6200, "size": "M", "qty": 1,
    }
    make_order(db, total=2500 * 4, items=[chain])
    make_order(db, total=6200, items=[hoodie])

    rows = client.get("/analytics/top-products").json()
    assert rows[0]["name"] == "Chrome Cross Chain"
    assert rows[0]["units"] == 4
    assert rows[0]["revenue"] == 10000
    assert rows[1]["name"] == "Cyber Hoodie (Black)"


def test_sales_timeline_covers_requested_days(client, db):
    make_order(db, total=6200, days_ago=0)
    make_order(db, total=3000, days_ago=2, items=[{
        "product_id": 7, "name": "Skull Ring Set", "category": "Jewelry",
        "price": "1,500 LEK", "unit_price": 1500, "size": "7", "qty": 2,
    }])

    body = client.get("/analytics/sales-timeline", params={"days": 7}).json()
    assert body["days"] == 7
    points = body["points"]
    assert len(points) == 7
    assert [point["date"] for point in points] == sorted(point["date"] for point in points)
    assert sum(point["revenue"] for point in points) == 6200 + 1500 * 2
    assert sum(point["orders"] for point in points) == 2


def test_timeline_validates_days(client):
    assert client.get("/analytics/sales-timeline", params={"days": 0}).status_code == 422
    assert client.get("/analytics/sales-timeline", params={"days": 400}).status_code == 422


def test_stock_alerts_low_inventory_only(client, db):
    alerts = client.get("/analytics/stock-alerts").json()
    # seeded low-stock products: stock <= 5
    assert {alert["name"] for alert in alerts} == {
        p["name"] for p in CATALOGUE if p["stock"] <= 5
    }

    # Skull Ring Set ships with stock 3 (low-stock seeded product)
    from models import Product

    ring_id = db.query(Product).filter(Product.name == "Skull Ring Set").one().id
    make_order(db, total=3000, items=[{
        "product_id": ring_id, "name": "Skull Ring Set", "category": "Jewelry",
        "price": "1,500 LEK", "unit_price": 1500, "size": "7", "qty": 2,
    }])
    rings = next(a for a in client.get("/analytics/stock-alerts").json() if a["id"] == ring_id)
    assert rings["units_sold"] == 2
    assert rings["stock"] == 3


def test_orders_csv_export(client, db):
    make_order(db, total=6200)
    response = client.get("/analytics/export/orders.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "climax_orders.csv" in response.headers["content-disposition"]

    lines = response.text.strip().splitlines()
    header = lines[0].split(",")
    assert {"order_id", "product_name", "category", "quantity", "line_total"} <= set(header)
    assert len(lines) == 2  # one item row


def test_products_csv_export(client):
    response = client.get("/analytics/export/products.csv")
    assert response.status_code == 200
    lines = response.text.strip().splitlines()
    assert lines[0].split(",") == [
        "product_id", "product_name", "category", "price_lek", "stock", "badge",
    ]
    assert len(lines) == 10  # header + 9 products
    assert "Cyber Hoodie (Black)" in lines[1]
