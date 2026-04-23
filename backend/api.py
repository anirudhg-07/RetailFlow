from __future__ import annotations

from decimal import Decimal, InvalidOperation

from flask import Blueprint, request

from db import get_connection

bp = Blueprint("api", __name__, url_prefix="/api")


def _parse_int(value) -> int | None:
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_decimal(value) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None


@bp.post("/orders")
def api_create_order():
    """Create an order transactionally.

    Request JSON:
      {
        "customer_id": 123 | null,
        "items": [{"product_id": 1, "quantity": 2, "price": 9.99?}, ...]
      }

    Price is optional; if omitted, Product.price is used.
    """

    data = request.get_json(silent=True) or {}
    customer_id = _parse_int(data.get("customer_id"))
    items_in = data.get("items")

    if not isinstance(items_in, list) or len(items_in) == 0:
        return {"ok": False, "error": "items must be a non-empty list"}, 400

    # Normalize items
    items: list[dict] = []
    for idx, it in enumerate(items_in):
        if not isinstance(it, dict):
            return {"ok": False, "error": f"item {idx} must be an object"}, 400
        pid = _parse_int(it.get("product_id"))
        qty = _parse_int(it.get("quantity"))
        price = _parse_decimal(it.get("price")) if "price" in it and it.get("price") is not None else None

        if not pid:
            return {"ok": False, "error": f"item {idx}: product_id is required"}, 400
        if qty is None or qty <= 0:
            return {"ok": False, "error": f"item {idx}: quantity must be > 0"}, 400
        if price is not None and price < 0:
            return {"ok": False, "error": f"item {idx}: price must be >= 0"}, 400

        items.append({"product_id": pid, "quantity": qty, "price": price})

    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # Validate customer (allow NULL customer_id)
        if customer_id is not None:
            cur.execute("SELECT 1 FROM Customer WHERE customer_id=%s", (customer_id,))
            if not cur.fetchone():
                return {"ok": False, "error": "customer not found"}, 400

        # Load products with a row lock to prevent overselling in concurrent orders
        product_ids = sorted({it["product_id"] for it in items})
        placeholders = ",".join(["%s"] * len(product_ids))
        cur.execute(
            f"""
            SELECT product_id, price, quantity
            FROM Product
            WHERE product_id IN ({placeholders})
            FOR UPDATE
            """,
            tuple(product_ids),
        )
        products = {row["product_id"]: row for row in cur.fetchall()}

        for it in items:
            p = products.get(it["product_id"])
            if not p:
                return {"ok": False, "error": f"product {it['product_id']} not found"}, 400
            if p["quantity"] < it["quantity"]:
                return {
                    "ok": False,
                    "error": f"insufficient stock for product {it['product_id']}",
                    "available": int(p["quantity"]),
                }, 400
            if it["price"] is None:
                it["price"] = Decimal(str(p["price"]))

        total = sum((it["price"] * it["quantity"] for it in items), Decimal("0"))

        # Insert Orders
        cur2 = conn.cursor()  # regular cursor for lastrowid consistency
        cur2.execute(
            """
            INSERT INTO Orders (customer_id, order_date, total_amount)
            VALUES (%s, CURDATE(), %s)
            """,
            (customer_id, str(total)),
        )
        order_id = cur2.lastrowid

        # Insert Order_Details + decrement stock
        for it in items:
            cur2.execute(
                """
                INSERT INTO Order_Details (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, it["product_id"], it["quantity"], str(it["price"])),
            )
            cur2.execute(
                """
                UPDATE Product
                SET quantity = quantity - %s
                WHERE product_id = %s
                """,
                (it["quantity"], it["product_id"]),
            )

        conn.commit()
        return {"ok": True, "order_id": int(order_id), "total_amount": str(total)}
    except Exception as e:
        conn.rollback()
        return {"ok": False, "error": str(e)}, 500
    finally:
        conn.close()
