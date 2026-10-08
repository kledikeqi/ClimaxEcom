# Climax — Gothic Streetwear E-commerce

Full-stack e-commerce showcase: an **Expo / React Native** storefront that runs on
**web and mobile**, backed by a **FastAPI + SQLite** API with a **Python/pandas
analytics layer** and **Power BI ready** CSV exports.

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Storefront | React Native 0.81 + Expo 54 (`react-native-web`)        |
| API        | FastAPI, SQLAlchemy, Pydantic, SQLite                    |
| Analytics  | Python 3.13 + pandas 3 (aggregations, KPIs, CSV export) |
| BI         | Power BI Desktop (Web connector + DAX)                   |

## Quick start

Requirements: **Node 20+**, **Python 3.13**.

```bash
make install     # once: venv + backend deps + npm install
make backend     # terminal 1 → http://localhost:8000
make frontend    # terminal 2 → http://localhost:8081
```

Open **http://localhost:8081** — the shop, cart, checkout and the analytics
dashboard all work from the browser.

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

## Project structure

```
ClimaxEcom/
├── backend/                 FastAPI service + pandas analytics
│   ├── main.py              app, CORS, product & order routes
│   ├── analytics.py         /analytics/* KPI endpoints + CSV export
│   ├── seed.py              catalogue + demo order history
│   ├── models.py            SQLAlchemy models (Product, Order)
│   ├── schemas.py           Pydantic request/response contracts
│   ├── database.py          engine, session, lightweight migrations
│   ├── climax.db            SQLite (auto-created and seeded on first run)
│   └── requirements.txt
├── frontend/                Expo app (web + mobile)
│   ├── App.js               shell: state, navigation, modals
│   └── src/
│       ├── api.js           typed fetch helpers + timeouts
│       ├── config.js        API base URL resolution (web / device / env)
│       ├── theme.js         design tokens (colours, radius, shadows)
│       ├── ToastContext.js  cross-platform notifications
│       ├── components/      Header, MenuSidebar, ProductCard, CartModal,
│       │                    ProductModal, StatCard, StateViews, charts/
│       └── screens/         Shop, Wishlist, Dashboard (analytics), Team, Contact
├── docs/POWER_BI.md         Power BI setup guide + DAX measures
└── Makefile
```

## API

| Method | Path                            | Purpose                                   |
| ------ | ------------------------------- | ----------------------------------------- |
| GET    | `/health`                       | service health                            |
| GET    | `/products`                     | product catalogue                         |
| POST   | `/products`                     | create a product                          |
| POST   | `/orders`                       | checkout                                  |
| GET    | `/analytics/summary`            | revenue, orders, AOV, 7-day growth, stock |
| GET    | `/analytics/sales-timeline`     | daily revenue & order count               |
| GET    | `/analytics/revenue-by-category`| revenue split per category                |
| GET    | `/analytics/top-products`       | best sellers by revenue                   |
| GET    | `/analytics/stock-alerts`       | products at or below the low-stock limit  |
| GET    | `/analytics/export/orders.csv`  | flat fact table for Power BI              |
| GET    | `/analytics/export/products.csv`| product dimension for Power BI            |

Interactive documentation: <http://localhost:8000/docs>

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

On first run the backend seeds **9 products** and **90 orders** spread over the last
45 days so the dashboard is never empty. Demo orders are flagged `is_demo = 1` in
the database and in the CSV export, so real orders can be filtered out in Power BI
(`is_demo = FALSE`).

## Configuration

| Variable             | Default                     | Where   | Purpose                        |
| -------------------- | --------------------------- | ------- | ------------------------------ |
| `EXPO_PUBLIC_API_URL`| auto (see `src/config.js`)  | frontend| Override the API base URL       |
| `CORS_ORIGINS`       | `*`                         | backend | Comma-separated allowed origins |
