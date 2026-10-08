VALID_CARD = {
    "number": "4242 4242 4242 4242",
    "exp": "12/30",
    "cvc": "123",
}


def _payload(card=None, total=6200):
    return {
        "customer_name": "Shopper",
        "address": "Rr. Test 1, Tirana",
        "phone": "+355 69 111 2222",
        "total_price": total,
        "items": [{"name": "Cyber Hoodie (Black)", "qty": 1, "unit_price": 6200}],
        "card": card or VALID_CARD,
    }


def test_payment_config_reports_demo_mode_without_keys(client):
    response = client.get("/payments/config")
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "demo"
    assert body["currency"] == "all"


def test_demo_pay_requires_auth(client):
    assert client.post("/payments/demo-pay", json=_payload()).status_code == 401


def test_demo_pay_success_creates_paid_order(client, register, db):
    from models import Order

    headers = register()
    response = client.post("/payments/demo-pay", json=_payload(), headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["mode"] == "demo"
    assert body["order_id"] > 0

    order = db.get(Order, body["order_id"])
    assert order.status == "Paid"
    assert order.payment_method == "demo"
    assert order.user_id is not None


def test_demo_pay_rejects_invalid_card_number(client, register):
    headers = register()
    bad = _payload(card={"number": "1234 5678 9012 3456", "exp": "12/30", "cvc": "123"})
    response = client.post("/payments/demo-pay", json=bad, headers=headers)
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()


def test_demo_pay_rejects_expired_card(client, register):
    headers = register()
    bad = _payload(card={"number": "4242 4242 4242 4242", "exp": "01/20", "cvc": "123"})
    response = client.post("/payments/demo-pay", json=bad, headers=headers)
    assert response.status_code == 400
    assert "expiry" in response.json()["detail"].lower()


def test_demo_pay_rejects_bad_cvc(client, register):
    headers = register()
    bad = _payload(card={"number": "4242 4242 4242 4242", "exp": "12/30", "cvc": "abc"})
    response = client.post("/payments/demo-pay", json=bad, headers=headers)
    assert response.status_code == 400


def test_checkout_falls_back_to_demo_without_stripe_key(client, register):
    headers = register()
    payload = {k: v for k, v in _payload().items() if k != "card"}
    response = client.post("/payments/checkout", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"mode": "demo", "order_id": None}


def test_checkout_requires_auth(client):
    payload = {k: v for k, v in _payload().items() if k != "card"}
    assert client.post("/payments/checkout", json=payload).status_code == 401


def test_verify_rejected_when_stripe_disabled(client, register):
    headers = register()
    response = client.get("/payments/verify", params={"session_id": "cs_test_x"}, headers=headers)
    assert response.status_code == 400
