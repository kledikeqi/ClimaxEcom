def test_register_returns_token_and_user(client):
    response = client.post(
        "/auth/register",
        json={"email": "New@Example.com", "password": "SuperSecret1", "full_name": "New User"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "new@example.com"  # normalised
    assert body["user"]["is_admin"] is False


def test_register_duplicate_email_conflict(client):
    payload = {"email": "dup@example.com", "password": "SuperSecret1"}
    assert client.post("/auth/register", json=payload).status_code == 201
    assert client.post("/auth/register", json=payload).status_code == 409


def test_register_rejects_short_password(client):
    response = client.post(
        "/auth/register", json={"email": "x@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    response = client.post(
        "/auth/register", json={"email": "not-an-email", "password": "SuperSecret1"}
    )
    assert response.status_code == 422


def test_login_success_and_failure(client):
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "SuperSecret1"},
    )
    ok = client.post(
        "/auth/login", json={"email": "login@example.com", "password": "SuperSecret1"}
    )
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    wrong = client.post(
        "/auth/login", json={"email": "login@example.com", "password": "WrongPass1"}
    )
    assert wrong.status_code == 401

    unknown = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "SuperSecret1"}
    )
    assert unknown.status_code == 401


def test_me_requires_valid_token(client, register):
    headers = register()
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "shopper@example.com"

    assert client.get("/auth/me").status_code == 401
    assert client.get(
        "/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    ).status_code == 401


def test_admin_role_is_protected(client, register, admin_headers):
    # regular customer cannot create products
    customer = register()
    forbidden = client.post(
        "/products",
        json={"name": "Hack", "category": "Jewelry", "price": "1 LEK"},
        headers=customer,
    )
    assert forbidden.status_code == 403

    # anonymous cannot either
    assert client.post(
        "/products", json={"name": "Hack", "category": "Jewelry", "price": "1 LEK"}
    ).status_code == 401

    # seeded admin can
    created = client.post(
        "/products",
        json={"name": "Admin Item", "category": "Jewelry", "price": "900 LEK"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    assert created.json()["name"] == "Admin Item"
