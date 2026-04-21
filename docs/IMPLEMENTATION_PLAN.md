# Phase-wise Implementation Plan

This document was previously `proj/README.md`.

(Contents below)

---

# Sales & Inventory Management System — Website Plan (Phase-wise)

This README is a **phase-wise implementation plan** for building a website on top of your MySQL database `SalesInventoryDB`.

## ✅ Decisions you confirmed

- `order_summary` is not needed → **removed** (it was a VIEW).
- No `Employee` table → **removed** `employee_id` and its foreign key from `Orders`.
- When an order is placed, **Product quantity must decrease**.
- **No negative quantity** is allowed (block order if stock is insufficient).

## Current database schema (as implemented)

### Tables

- `Customer`
	- `customer_id` (PK, auto increment)
	- `customer_name` (varchar(100), not null)
	- `phone` (varchar(15), not null)
	- `email` (varchar(100), unique, nullable)

- `Supplier`
	- `supplier_id` (PK, auto increment)
	- `supplier_name` (varchar(100), not null)
	- `phone` (varchar(15), not null)
	- `email` (varchar(100), unique, nullable)
	- `address` (varchar(255), not null)

- `Product`
	- `product_id` (PK, auto increment)
	- `product_name` (varchar(100), not null)
	- `category` (varchar(50), not null)
	- `price` (decimal(10,2), not null)
	- `quantity` (int, not null)
	- `supplier_id` (FK → `Supplier.supplier_id`, nullable)

- `Orders`
	- `order_id` (PK, auto increment)
	- `customer_id` (FK → `Customer.customer_id`, nullable)
	- `order_date` (date, not null)
	- `total_amount` (decimal(10,2), not null)

- `Order_Details`
	- `order_detail_id` (PK, auto increment)
	- `order_id` (FK → `Orders.order_id`, nullable)
	- `product_id` (FK → `Product.product_id`, nullable)
	- `quantity` (int, not null)
	- `price` (decimal(10,2), not null)

### Relationships (what the code must respect)

- Supplier 1 → * Products (`Product.supplier_id`)
- Customer 1 → * Orders (`Orders.customer_id`)
- Orders 1 → * Order_Details (`Order_Details.order_id`)
- Product 1 → * Order_Details (`Order_Details.product_id`)

## Website scope (tiny contract)

### Inputs
- Admin/staff uses web UI to manage master data and place orders.

### Outputs
- Correct inserts/updates in MySQL.
- Stock decreases as orders are placed.

### Core error rules
- Don’t allow negative stock.
- If any line item fails (stock/validation), the whole order must fail (**transaction rollback**).

---

## Phase 0 — Project + DB readiness (1–2 sessions)

### Deliverables
- A runnable backend project with environment-based DB config
- A health-check page and/or `/api/health`

### Tasks
- Create backend project structure (recommended: **Flask**)
- Add `.env` support (never hardcode password in code)
- Create a DB connection helper
- Add a simple DB health check: connect + run `SELECT 1`

### Done-already notes
- `order_summary` removed
- `Orders.employee_id` removed

---

## Phase 1 — Master data management (CRUD) (2–4 sessions)

Goal: site can manage Supplier/Product/Customer.

### 1A) Supplier module
- Pages:
	- List suppliers
	- Create supplier
	- Edit supplier
	- Delete supplier (block delete if products exist)
- API (optional): `/api/suppliers`

### 1B) Product module
- Pages:
	- Product list with supplier name (JOIN)
	- Create/edit product
	- Delete product (block delete if referenced in order_details)
	- Search/filter (name/category/supplier)
- Validation:
	- `price >= 0`
	- `quantity >= 0`

### 1C) Customer module
- Pages:
	- List customers
	- Create/edit customer
	- Delete customer (block delete if orders exist)

---

## Phase 2 — Orders module (transaction + stock control) (3–6 sessions)

Goal: create orders with multiple items, and stock updates correctly.

### 2A) Create Order UI
- Choose customer
- Add 1..N items:
	- product
	- quantity
	- price (default from Product.price, but stored in Order_Details.price)
- Show computed totals in UI

### 2B) Backend transaction logic (must be atomic)

When user submits an order:

1. Start transaction
2. Validate:
	 - Each item quantity is positive
	 - Product exists
	 - `Product.quantity >= requested_quantity` for every item
3. Insert into `Orders` (total_amount computed)
4. Insert into `Order_Details` for each line
5. Update stock:
	 - `UPDATE Product SET quantity = quantity - %s WHERE product_id = %s`
6. Commit
7. On any error: rollback, show message

### 2C) Order list + details pages
- Orders list: filter by date, customer
- Order detail page: show header + items

---

## Phase 3 — Reports & dashboard (2–4 sessions)

Goal: management views.

### Pages
- Dashboard numbers:
	- Total products
	- Low stock count (threshold)
	- Orders today/month
	- Revenue today/month
- Reports:
	- Sales by date range
	- Best-selling products (SUM of Order_Details.quantity)
	- Low stock report

---

## Phase 4 — Authentication & roles (optional) (2–5 sessions)

Goal: protect the admin site.

- Login/logout
- Roles:
	- `admin`: full access
	- `staff`: no delete + limited pages
- Secure session cookies

---

## Phase 5 — Hardening (ongoing)

- Pagination on lists
- Input sanitization + stronger validation
- Better error handling and friendly messages
- Unit tests:
	- Order transaction (happy path)
	- Insufficient stock (rollback)
	- Concurrent order attempts (at least basic protections)

---

## Indexes (what they are + what you need)

### What is an index?
An index is a data structure MySQL uses to find rows faster.

- Without an index, MySQL may scan the whole table (slow when rows grow).
- With an index, it can find matching rows quickly.

### Which columns should be indexed?
**Rule of thumb:** index columns that are frequently used in:
- JOIN conditions
- WHERE filters
- foreign keys

### Your DB (recommended indexes)
Most of these exist automatically because of PK/FK definitions, but we’ll confirm and add missing ones later.

- `Product.supplier_id` (for supplier → products screens)
- `Orders.customer_id` (for customer → orders screens)
- `Order_Details.order_id` (for order detail page)
- `Order_Details.product_id` (for product sales summary)

Optional helpful indexes:
- `Product(product_name)` for search
- `Product(category)` for category filter
- `Orders(order_date)` for date range report

### When to add indexes?
Add them after Phase 2 when your pages and queries are stable. Too many indexes can slow inserts/updates.

---

## To start implementing

Pick where you want to start:

1. **Phase 1B Products** (fastest visible progress)
2. **Phase 2 Orders** (core business logic; a bit harder but important)
3. **Phase 1A Suppliers + 1C Customers** (clean foundation)

Tell me which one you want first, and I’ll implement it end-to-end in code.

