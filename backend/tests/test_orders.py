from conftest import make_order
from models import Order


def test_catalogue_is_seeded(client):
    response = client.get("/products")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 9
    assert {"id", "name", "category", "price", "stock"} <= set(products[0])


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_order_requires_authentication(client, db):
    payload = {
        "customer_name": "A",
        "address": "B",
        "phone": "+355 69 111 2222",
        "total_price": 6200,
        "items": [{"name": "Cyber Hoodie (Black)", "qty": 1, "unit_price": 6200}],
    }
    assert client.post("/orders", json=payload).status_code == 401

    headers = {"Authorization": "Bearer invalid"}
    assert client.post("/orders", json=payload, headers=headers).status_code == 401


def test_cod_order_records_user_and_method(client, db, register):
    headers = register()
    payload = {
        "customer_name": "Shopper",
        "address": "Rr. Test 1, Tirana",
        "phone": "+355 69 111 2222",
        "total_price": 6200,
        "items": [{"name": "Cyber Hoodie (Black)", "qty": 1, "unit_price": 6200}],
    }
    response = client.post("/orders", json=payload, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["order_id"] > 0

    order = db.get(Order, body["order_id"])
    assert order is not None
    assert order.status == "Confirmed"
    assert order.payment_method == "cod"
    assert order.user_id is not None


def test_empty_cart_order_rejected(client, register):
    headers = register()
    response = client.post(
        "/orders",
        json={
            "customer_name": "A",
            "address": "B",
            "phone": "+355 69 111 2222",
            "total_price": 100,
            "items": [],
        },
        headers=headers,
    )
    assert response.status_code == 400


def test_orders_mine_only_returns_my_orders(client, register, db):
    other_headers = register(email="other@example.com")
    make_order(db, total=5000)  # not linked to any user

    mine = client.get("/orders/mine", headers=other_headers)
    assert mine.status_code == 200
    assert mine.json() == []
    assert db.query(Order).count() == 1

    payload = {
        "customer_name": "Other",
        "address": "Addr",
        "phone": "+355 69 333 4444",
        "total_price": 5000,
        "items": [{"name": "Skull Ring Set", "qty": 1, "unit_price": 1500}],
    }
    client.post("/orders", json=payload, headers=other_headers)
    mine = client.get("/orders/mine", headers=other_headers)
    orders = mine.json()
    assert len(orders) == 1
    assert orders[0]["payment_method"] == "cod"
    assert orders[0]["total_price"] == 5000
