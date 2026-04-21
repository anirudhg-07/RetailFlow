# PRD — Sales & Inventory Management Website (Flask + MySQL)

(Contents below)

---

## 1) Overview

Build a web-based Sales & Inventory Management System for a retailer to manage stock, suppliers, customers, and sales orders (billing). The system uses an existing MySQL database named `SalesInventoryDB`.

This is an **internal retailer/admin website**, not a public e-commerce store.

## 2) Goals

- Provide a simple, reliable workflow to:
	- maintain master data (Products, Suppliers, Customers)
	- create Orders with multiple items
	- automatically reduce stock on sale
	- prevent overselling (no negative stock)
- Produce basic sales and stock reports.

## 3) Non-goals (out of scope for initial release)

- Public customer shopping cart/checkout site
- Online payments
- Shipping/delivery tracking
- Employee module (no `Employee` table)

## 4) Users & roles

### Primary users
- **Admin/Owner**: can manage everything.
- **Staff/Cashier**: can create orders and view lists/reports; may have limited delete permissions (optional feature).

### Optional future users
- Customers (read-only portal / order history) — not in initial scope.

## 5) Current database constraints (must match)

- Database: `SalesInventoryDB`
- `order_summary` removed (it was a VIEW and it’s not needed)
- `Orders.employee_id` removed
- Stock is stored in `Product.quantity`.

### Key tables
- `Supplier(supplier_id PK, supplier_name, phone, email UNIQUE NULL, address)`
- `Product(product_id PK, product_name, category, price, quantity, supplier_id FK NULL)`
- `Customer(customer_id PK, customer_name, phone, email UNIQUE NULL)`
- `Orders(order_id PK, customer_id FK NULL, order_date, total_amount)`
- `Order_Details(order_detail_id PK, order_id FK NULL, product_id FK NULL, quantity, price)`

## 6) Functional requirements

### FR1 — Supplier Management
- Create, view list, update supplier
- Delete supplier only if not referenced by products

**Acceptance criteria**
- Supplier list loads in < 2s for typical datasets
- Attempting to delete a supplier referenced by `Product.supplier_id` should be blocked with a clear error

### FR2 — Product Management
- Create, view list, update product
- Product fields: name, category, price, quantity, supplier(optional)
- Search/filter by name/category

**Validation rules**
- `price >= 0`
- `quantity >= 0`

**Acceptance criteria**
- Creating/editing product enforces validation
- Product list shows current quantity and price

### FR3 — Customer Management
- Create, view list, update customer
- Delete customer only if not referenced by orders

**Acceptance criteria**
- Attempting to delete a customer referenced by `Orders.customer_id` should be blocked with a clear error

### FR4 — Order Creation (Core)
- Create an order for a selected customer
- Order contains 1..N order items
- For each item:
	- select product
	- enter quantity (>0)
	- price defaults from Product.price (editable optional)
- Total amount is computed and stored in `Orders.total_amount`

**Stock behavior**
- On successful order placement, reduce stock: `Product.quantity -= sold_quantity`
- Reject order if any product has insufficient stock
- Never allow stock to go negative

**Atomicity**
- Order creation must be transactional:
	- if any line fails, the entire order fails and nothing is inserted/updated

**Acceptance criteria**
- If stock is insufficient, no rows are inserted into `Orders`/`Order_Details` and stock remains unchanged
- If order succeeds:
	- `Orders` row exists
	- N `Order_Details` rows exist
	- all relevant product quantities are decreased correctly

### FR5 — Orders List & Order Detail
- Orders list with filters (date range, customer)
- Order detail shows order header + line items

**Acceptance criteria**
- Order detail accurately matches DB rows

### FR6 — Reports (initial)
- Low-stock report (configurable threshold)
- Sales report by date range
- Best selling products

**Acceptance criteria**
- Reports match DB calculations

## 7) Non-functional requirements

### NFR1 — Security
- Use environment variables for DB credentials
- Prevent SQL injection (parameterized queries)
- (If auth added) secure sessions/cookies

### NFR2 — Reliability
- Defensive handling of DB connection errors
- Proper commit/rollback for order transaction

### NFR3 — Performance
- Use indexes for common filters and joins
- Avoid loading unbounded datasets; paginate once needed

### NFR4 — Maintainability
- Clear project structure
- Minimal repeated SQL; helper functions
- Tests for order stock/transaction logic

## 8) Indexing requirements

Existing FK indexes already support joins:
- `Product.supplier_id`
- `Orders.customer_id`
- `Order_Details.order_id`
- `Order_Details.product_id`

Added for search/report performance:
- `idx_product_name` on `Product(product_name)`
- `idx_product_category` on `Product(category)`
- `idx_orders_order_date` on `Orders(order_date)`

## 9) Release plan (phases)

- Phase 1: Supplier/Product/Customer CRUD
- Phase 2: Order creation + orders pages + stock decrement
- Phase 3: Dashboard + reports
- Phase 4 (optional): Authentication/roles

## 9A) Phase-wise implementation plan (Frontend + Backend)

This section describes **what we will build in each phase**, split into **frontend pages** and **backend endpoints/services**, plus DB tables touched and tests.

### Phase 0 — Project skeleton + DB connectivity

**Frontend (UI)**
- Basic layout: navbar + flash messages
- Home page with links to modules

**Backend (server)**
- Flask app bootstrap
- Config via `.env` (DB host/user/password/name)
- DB connection helper (mysql-connector)
- Health check route: `GET /api/health` (connect + `SELECT 1`)

**DB touched**
- None (read-only health check)

**Tests**
- Smoke test: health check returns OK

---

### Phase 1 — Master data CRUD (Supplier, Product, Customer)

#### 1A) Supplier module

**Status: ✅ Completed (as of 22 Apr 2026)**

**Frontend (pages)**
- `GET /suppliers`: list suppliers, search (optional)
- `POST /suppliers`: create supplier
- `GET /suppliers/<id>/edit`: edit form
- `POST /suppliers/<id>/edit`: update
- `POST /suppliers/<id>/delete`: delete (blocked if used)

**Backend (logic)**
- Validation: required fields, email format (optional)
- Delete rule: block if supplier is referenced in `Product.supplier_id`

**DB touched**
- `Supplier` (CRUD)
- `Product` (reference check on delete)

#### 1B) Product module

**Status: ✅ Completed (as of 22 Apr 2026)**

**Frontend (pages)**
- `GET /products`: list with search by `product_name`, filter by `category`
- `POST /products`: create product
- `GET /products/<id>/edit` + update
- `POST /products/<id>/delete` (blocked if referenced)

**Backend (logic)**
- Validation: `price >= 0`, `quantity >= 0`
- If supplier_id provided: must exist in `Supplier`

**DB touched**
- `Product` (CRUD)
- `Supplier` (FK existence validation)
- `Order_Details` (reference check on delete)

#### 1C) Customer module

**Frontend (pages)**
- `GET /customers`: list
- `POST /customers`: create
- edit/update
- delete (blocked if referenced)

**Backend (logic)**
- Delete rule: block if referenced by `Orders.customer_id`

**DB touched**
- `Customer` (CRUD)
- `Orders` (reference check on delete)

**Tests (Phase 1)**
- Create/edit validations
- Delete blocking rules for Supplier/Customer/Product

---

### Phase 2 — Orders (transactional) + stock decrement (core)

#### 2A) Create order flow

**Frontend (pages)**
- `GET /orders/new`: order form
	- select customer
	- add multiple line items (product + qty [+ optional editable price])
	- show computed totals
- `POST /orders`: submit order

**Backend (logic)**
- Transaction boundary (MUST be atomic):
	1. Validate inputs (customer exists, items not empty)
	2. For each item:
		 - product exists
		 - quantity > 0
		 - stock check: `Product.quantity >= requested`
	3. Create `Orders` row (total computed)
	4. Create `Order_Details` rows
	5. Decrement stock for each product
	6. Commit; otherwise rollback

**DB touched**
- `Orders` (insert)
- `Order_Details` (insert)
- `Product` (update quantity)
- `Customer` (read)

#### 2B) Orders browsing

**Frontend (pages)**
- `GET /orders`: list + filters (date range, customer)
- `GET /orders/<id>`: detail (header + items)

**Backend (logic)**
- Efficient queries using:
	- `Orders.order_date` index for date filtering
	- `Order_Details.order_id` index for detail lookup

**Tests (Phase 2)**
- Happy path: order inserts + stock decreases correctly
- Insufficient stock: rollback (no inserts, no stock change)
- Bad input: quantity <= 0 rejected

---

### Phase 3 — Dashboard + reports

**Frontend (pages)**
- `GET /dashboard`: KPI cards
- `GET /reports/sales`: date range sales
- `GET /reports/low-stock`: stock threshold
- `GET /reports/top-products`: best-selling products

**Backend (logic)**
- Aggregation queries on `Orders` and `Order_Details`
- Use existing indexes + add more only if real slow queries appear

**DB touched**
- Read-only across tables

**Tests (Phase 3)**
- Report query correctness on sample data

---

### Phase 4 — Authentication + roles (optional)

**Frontend (pages)**
- `GET/POST /login`, `POST /logout`

**Backend (logic)**
- Role permissions (admin vs staff)
- Protect write endpoints

**DB touched**
- If implemented, add `Users` table (new) or use a simple admin-only login in config (not recommended long-term)

---

### Phase 5 — Hardening + UX improvements

**Frontend**
- Pagination, form improvements, confirmation dialogs

**Backend**
- Better error handling
- More tests
- (Optional) migration scripts for schema/index changes

## 10) Success metrics

- Staff can place an order in under 60 seconds
- No negative stock incidents
- Correct totals and stock movement in all tested cases
- Basic reports available without manual SQL queries

