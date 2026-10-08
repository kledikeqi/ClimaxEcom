# Climax — Gothic Streetwear E-commerce

Full-stack e-commerce showcase: an **Expo / React Native (TypeScript)** storefront
that runs on **web and mobile**, backed by a **FastAPI + SQLAlchemy** API with
JWT auth, **Stripe-ready payments with a demo fallback**, a **Python/pandas
analytics layer**, **Power BI** CSV exports, **Docker Compose**, and a fully
automated **GitHub Actions CI pipeline**.

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Storefront | React Native 0.81 + Expo 54, TypeScript (strict), react-native-web         |
| API        | FastAPI, SQLAlchemy, Pydantic v2, SQLite **or** PostgreSQL via `DATABASE_URL` |
| Auth       | JWT (PyJWT) + bcrypt, admin roles                                          |
| Payments   | Stripe Checkout (server-side), demo-card fallback with Luhn/expiry checks, COD |
| Analytics  | Python 3.13 + pandas 3 (aggregations, KPIs, CSV export)                    |
| BI         | Power BI Desktop (Web connector + DAX)                                     |
| Infra      | Docker Compose (nginx + FastAPI + Postgres), GitHub Actions CI            |
| Tests      | pytest (31), jest/ts-jest (26), headless browser E2E                       |

## Quick start (local dev)

Requirements: **Node 20+**, **Python 3.13**.

```bash
make install     # once: venv + backend deps + npm install
make backend     # terminal 1 → http://localhost:8000
make frontend    # terminal 2 → http://localhost:8081
```

Open **http://localhost:8081** — shop, auth, cart, checkout and the analytics
dashboard all work from the browser. Without a `STRIPE_SECRET_KEY` the checkout
runs in **demo mode** (test card `4242 4242 4242 4242`, any future expiry, any
CVV). Interactive API docs: <http://localhost:8000/docs>.

<details>
<summary>Manual commands (no make)</summary>

```bash
# backend
python3 -m venv venv
venv/bin/pip install -r backend/requirements.txt
cd backend && ../venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

# frontend (new terminal)
cd frontend && npm install && npx expo start
```

</details>

## Docker Compose (Postgres + nginx)

```bash
docker compose up --build
# Frontend http://localhost:8080 · Backend http://localhost:8000 (docs at /docs)
```

The nginx container reverse-proxies `/api` to the backend, so requests are
same-origin and no CORS is needed. Set environment overrides with a `.env` file
next to `docker-compose.yml` (see Configuration below).

## Testing

| Suite                  | Command                                            |
| ---------------------- | -------------------------------------------------- |
| Backend (SQLite)       | `cd backend && ../venv/bin/python -m pytest`       |
| Backend (PostgreSQL)   | `DATABASE_URL=postgresql+psycopg://… ../venv/bin/python -m pytest` |
| Frontend unit tests    | `cd frontend && npx jest`                          |
| Frontend typecheck     | `cd frontend && npx tsc --noEmit`                  |

CI runs all of these on every push — including a Postgres service container and
Docker image builds — in `.github/workflows/ci.yml`.

## Project structure

```
ClimaxEcom/
├── backend/                  FastAPI service + pandas analytics
│   ├── main.py               app, CORS, product & order routers
│   ├── auth.py               JWT + bcrypt auth, /auth/* routes, admin guard
│   ├── payments.py           /payments/*: Stripe session / demo pay / verify
│   ├── analytics.py          /analytics/* KPI endpoints + CSV export
│   ├── seed.py               catalogue, demo orders, admin account
│   ├── models.py             SQLAlchemy models (Product, Order, User)
│   ├── schemas.py            Pydantic request/response contracts
│   ├── database.py           engine, session, dialect-aware migrations
│   ├── conftest.py           test bootstrap (SQLite tmp DB / PG via env)
│   ├── tests/                31 tests: auth, orders, payments, analytics
│   ├── Dockerfile
│   ├── requirements.txt      runtime deps
│   └── requirements-dev.txt  pytest
├── frontend/                 Expo app (web + mobile), TypeScript strict
│   ├── App.tsx               providers + Stripe return-session verification
│   ├── index.js              entry
│   ├── src/
│   │   ├── api.ts            typed fetch helpers, ApiError, auth/payment clients
│   │   ├── config.ts         API base URL resolution (web / device / env)
│   │   ├── theme.ts          design tokens + gradient helper
│   │   ├── AuthContext.tsx   token persistence (AsyncStorage), session state
│   │   ├── ToastContext.tsx  cross-platform notifications
│   │   ├── components/       Header, MenuSidebar, AuthModal, ProductCard,
│   │   │                     CartModal (3-step checkout), ProductModal, charts/
│   │   ├── screens/          Shop, Wishlist, Dashboard, Team, Contact
│   │   └── utils/            format.ts, checkout.ts (+ jest unit tests)
│   ├── Dockerfile            expo export → nginx (SPA + /api proxy)
│   ├── nginx.conf
│   └── tsconfig.json         strict: true
├── .github/workflows/ci.yml  pytest (SQLite+PG), tsc, jest, docker build
├── docker-compose.yml        Postgres 16 + backend + nginx frontend
├── docs/POWER_BI.md          Power BI setup guide + DAX measures
└── Makefile
```

## API

| Method | Path                            | Auth      | Purpose                                   |
| ------ | ------------------------------- | --------- | ----------------------------------------- |
| GET    | `/health`                       | —         | service health                            |
| POST   | `/auth/register`                | —         | create account, returns JWT               |
| POST   | `/auth/login`                   | —         | JWT for existing account                  |
| GET    | `/auth/me`                      | Bearer    | current user profile                      |
| GET    | `/products`                     | —         | product catalogue                         |
| POST   | `/products`                     | admin     | create a product                          |
| POST   | `/orders`                       | Bearer    | checkout (cash on delivery)               |
| GET    | `/orders/mine`                  | Bearer    | the current user's orders                 |
| GET    | `/payments/config`              | —         | `{mode: "stripe"\|"demo", currency}`      |
| POST   | `/payments/checkout`            | Bearer    | create order + Stripe Checkout session    |
| POST   | `/payments/demo-pay`            | Bearer    | validate card, mark order paid (demo)     |
| GET    | `/payments/verify`              | —         | confirm Stripe session → mark paid        |
| GET    | `/analytics/summary`            | —         | revenue, orders, AOV, 7-day growth, stock |
| GET    | `/analytics/sales-timeline`     | —         | daily revenue & order count               |
| GET    | `/analytics/revenue-by-category`| —         | revenue split per category                |
| GET    | `/analytics/top-products`       | —         | best sellers by revenue                   |
| GET    | `/analytics/stock-alerts`       | —         | products at or below the low-stock limit  |
| GET    | `/analytics/export/orders.csv`  | —         | flat fact table for Power BI              |
| GET    | `/analytics/export/products.csv`| —         | product dimension for Power BI            |

## Demo account

On startup the backend seeds an admin account:

- Email: `admin@climax.store`
- Password: `ClimaxAdmin1!` (set `ADMIN_PASSWORD` — **change it in production**)

Anyone can `POST /auth/register` to shop; only the admin can create products.

## Analytics: pandas + Power BI

The `/analytics/*` endpoints are computed **server-side with pandas** — orders are
exploded into a line-item fact table, grouped, reindexed over a daily calendar and
returned as JSON for the in-app dashboard. The same pipeline exports flat CSVs so
**Power BI** can connect via *Get data → Web* and build an identical report with
DAX. Step-by-step setup and measures: **[docs/POWER_BI.md](docs/POWER_BI.md)**.

The **Analytics** screen in the app menu shows:

- KPI cards: total revenue, orders, average order value, units sold, 7-day growth, inventory value
- 30-day revenue column chart
- Revenue share by category
- Top products and stock alerts
- One-click CSV export for Power BI

## Data notes

On first run the backend seeds **9 products**, **90 demo orders** spread over the
last 45 days (so the dashboard is never empty) and the admin account. Demo orders
are flagged `is_demo = 1` in the database and in the CSV export, so real orders
can be filtered out in Power BI (`is_demo = FALSE`). Use `DEMO_ORDERS=0` to disable
the demo history (the test suite does this).

## Configuration

| Variable                 | Default                      | Used by  | Purpose                             |
| ------------------------ | ---------------------------- | -------- | ----------------------------------- |
| `DATABASE_URL`           | `sqlite:///climax.db`        | backend  | Set to a Postgres URL to switch engines |
| `JWT_SECRET`             | `dev-secret-change-me-in-production` | backend | HS256 signing key            |
| `ADMIN_EMAIL`            | `admin@climax.store`         | backend  | Seeded admin login                  |
| `ADMIN_PASSWORD`         | `ClimaxAdmin1!`              | backend  | Seeded admin password (change me!)  |
| `STRIPE_SECRET_KEY`      | *(empty → demo mode)*        | backend  | Enables real Stripe Checkout        |
| `STRIPE_CURRENCY`        | `all`                        | backend  | 2-decimals currency for Stripe      |
| `FRONTEND_URL`           | `http://localhost:8081`      | backend  | Return URL after Stripe checkout    |
| `CORS_ORIGINS`           | `*`                          | backend  | Comma-separated allowed origins     |
| `DEMO_ORDERS`            | `1`                          | backend  | `0` disables seeded demo orders     |
| `EXPO_PUBLIC_API_URL`    | auto (see `src/config.ts`)   | frontend | Override the API base URL           |