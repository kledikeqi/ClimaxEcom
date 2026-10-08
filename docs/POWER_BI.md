# Power BI setup — Climax analytics

The backend exposes two **flat, star-schema ready CSVs** generated with pandas:

| File            | Endpoint                                  | Grain                     |
| --------------- | ----------------------------------------- | ------------------------- |
| `climax_orders` | `/analytics/export/orders.csv`            | one row **per line item** |
| `climax_products` | `/analytics/export/products.csv`        | one row per product       |

Fact columns: `order_id, order_date, customer, status, is_demo, product_id,
product_name, category, size, quantity, unit_price, line_total, order_total`.

## 1. Connect

1. Start the API: `make backend` → <http://localhost:8000>.
2. Power BI Desktop → **Home → Get data → Web**.
3. URL: `http://localhost:8000/analytics/export/orders.csv` → **OK → Load**. Rename the query **Orders**.
4. Repeat for `http://localhost:8000/analytics/export/products.csv` → rename **Products**.

> Only the machine running the API can use `localhost`. To refresh from the Power BI
> *service*, host the API publicly and use its URL, or refresh from your laptop via
> a personal gateway.

## 2. Shape the data (Transform data)

In Power Query, for **Orders**:

| Column        | Type                | Note                                             |
| ------------- | ------------------- | ------------------------------------------------ |
| `order_date`  | Date                | values are `YYYY-MM-DD HH:MM` — type is enough    |
| `quantity`, `unit_price`, `line_total`, `order_total` | Whole number | |
| `is_demo`     | True/False (Boolean)| if imported as text: `= Value([is_demo] = "True")` |

For **Products**: `price_lek` and `stock` → Whole number.

## 3. Model

Model view → create relationship:

```
Orders[product_id]  ──many-to-one──►  Products[product_id]
```

Optional but recommended for time intelligence — **New table**:

```dax
Calendar =
VAR MinDate = MINX(Orders, INT(Orders[order_date]))
VAR MaxDate = MAXX(Orders, INT(Orders[order_date]))
RETURN CALENDAR(MinDate, MaxDate)
```

Then: `Calendar[Date]` one-to-many `Orders[order_date]` (use `INT(Orders[order_date])`
as the key column, or add a calculated column `order_date_day = INT([order_date])`).

## 4. DAX measures

Paste into **New measure**:

```dax
Total Revenue      = SUM(Orders[line_total])
Units Sold         = SUM(Orders[quantity])
Total Orders       = DISTINCTCOUNT(Orders[order_id])
Average Order Value = DIVIDE([Total Revenue], [Total Orders])

Revenue Last 7 Days =
CALCULATE([Total Revenue],
    DATESINPERIOD('Calendar'[Date], MAX('Calendar'[Date]), -7, DAY))

Revenue Previous 7 Days =
CALCULATE([Total Revenue],
    DATESINPERIOD('Calendar'[Date], MIN('Calendar'[Date]) - 8, -7, DAY))

WoW Growth % =
DIVIDE([Revenue Last 7 Days] - [Revenue Previous 7 Days],
       [Revenue Previous 7 Days])

Revenue Trend (30d) =
CALCULATE([Total Revenue],
    DATESINPERIOD('Calendar'[Date], MAX('Calendar'[Date]), -30, DAY))

Inventory Value    = SUMX(Products, Products[price_lek] * Products[stock])

Low Stock Products =
CALCULATE(COUNTROWS(Products), Products[stock] <= 5)

Top Category =
VAR TopOne = TOPN(1, SUMMARIZE(Orders, Orders[category], "Rev", [Total Revenue]), [Rev], DESC)
RETURN SELECTCOLUMNS(TopOne, "category")

Revenue (real orders) =
CALCULATE([Total Revenue], Orders[is_demo] = FALSE())

Demo Data Share % =
DIVIDE([Total Revenue] - [Revenue (real orders)], [Total Revenue])
```

## 5. Suggested report page

| Visual                        | Fields                                                |
| ----------------------------- | ----------------------------------------------------- |
| Card (KPI row)                | `Total Revenue`, `Total Orders`, `Average Order Value`, `Units Sold` |
| Line/area chart               | `Calendar[Date]` (axis) + `Revenue Trend (30d)`       |
| Stacked/clustered bar         | `Orders[category]` + `Total Revenue`                  |
| Table (Top N)                 | `Products[product_name]`, `Total Revenue`, `Units Sold` |
| Gauge / card                  | `WoW Growth %`, `Low Stock Products`, `Inventory Value` |
| Slicer                        | `Orders[status]`, `Orders[is_demo]`, `Orders[order_date]` |

## How this maps to the codebase

- **pandas** (`backend/analytics.py`) explodes carts into line items, joins product
  metadata, fills a daily calendar and computes every KPI — the same aggregations
  the web dashboard consumes.
- The **in-app Analytics screen** renders those JSON endpoints, so the Power BI page
  and the app always agree on numbers.
- Demo rows are `is_demo = TRUE`; filter them out to report on real orders only.
