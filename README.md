# RetailFlow — Sales & Inventory Management (Flask + MySQL + React)

RetailFlow is an internal **Sales & Inventory Management System** for a retailer to manage:

- Suppliers
- Products (pricing + stock)
- Customers
- Orders (transactional stock decrement)
- Dashboard + reports

It uses an existing MySQL database: **`SalesInventoryDB`**.

---

## Tech stack

- **Backend:** Flask, `mysql-connector-python`, CORS
- **Frontend:** Vite + React + TypeScript + Tailwind

---

## Repo structure

- `backend/` — Flask backend + API
- `frontend/` — React UI (Vite)
- `docs/` — PRD + implementation notes

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** (recommended)
- **MySQL** with database `SalesInventoryDB` and tables:
  `Supplier`, `Product`, `Customer`, `Orders`, `Order_Details`

---

## Backend setup (Flask)

### 1) Install Python dependencies

From the repo root:

```zsh
cd "./backend"
python3 -m pip install -r requirements.txt
```

### 2) Configure environment variables

Create a `.env` file in the repo root (or set these in your shell):

```ini
# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=SalesInventoryDB

# Flask
FLASK_HOST=127.0.0.1
FLASK_PORT=5001
FLASK_DEBUG=0
```

> Note: On macOS, port **5000** can be occupied by system services.
> This project defaults to **5001** for the backend.

### 3) Start the backend

From the repo root:

```zsh
cd "./"
FLASK_PORT=5001 python3 -m backend.app
```

Health check:

```zsh
curl -sS http://127.0.0.1:5001/api/health
```

---

## Frontend setup (React)

### 1) Install dependencies

```zsh
cd "./frontend"
npm install
```

### 2) Start the dev server

```zsh
npm run dev
```

Open the URL printed by Vite.

### API routing in dev (important)

In development, the frontend calls ` /api/* `.
Vite proxies these requests to the backend (default target: `http://127.0.0.1:5001`).

If you need to override the backend target for Vite proxy, set:

```zsh
export VITE_BACKEND_URL="http://127.0.0.1:5001"
```

---

## Key API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/products` / `POST /api/products` / `DELETE /api/products/:id`
- `GET /api/suppliers` / `POST /api/suppliers` / `DELETE /api/suppliers/:id`
- `GET /api/customers` / `POST /api/customers` / `DELETE /api/customers/:id`
- `POST /api/orders` / `GET /api/orders` / `GET /api/orders/:id`
- `GET /api/reports/top-products`
- `GET /api/reports/low-stock`

---

## Troubleshooting

### “Request failed: 502” / “Failed to fetch” in the UI

This almost always means the **backend isn’t running** or the dev proxy can’t reach it.

1) Confirm backend is up:

```zsh
curl -sS http://127.0.0.1:5001/api/health
```

2) Confirm Vite proxy target is correct:
- default: `http://127.0.0.1:5001`
- override with `VITE_BACKEND_URL`

### Port 5000 conflicts (macOS)

If Flask on port 5000 returns unexpected 403 responses, something else is likely bound to 5000.
Use port **5001** instead:

```zsh
FLASK_PORT=5001 python3 -m backend.app
```

---

## Tests

Backend tests:

```zsh
cd "./backend"
pytest
```

---

## License

Internal / educational project.
