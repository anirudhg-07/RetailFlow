from __future__ import annotations

from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, flash, redirect, render_template, request, url_for

from db import get_connection

bp = Blueprint("orders", __name__, url_prefix="")


def _parse_int(value: str) -> int | None:
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_decimal(value: str) -> Decimal | None:
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        return None


@bp.get("/orders/new")
def orders_new_form():
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        cur.execute(
            """
            SELECT customer_id, customer_name
            FROM Customer
            ORDER BY customer_name
            """
        )
        customers = cur.fetchall()

        cur.execute(
            """
            SELECT product_id, product_name, price, quantity
            FROM Product
            ORDER BY product_name
            """
        )
        products = cur.fetchall()

        return render_template(
            "orders/new.html",
            customers=customers,
            products=products,
            today=date.today().isoformat(),
        )
    finally:
        conn.close()


@bp.post("/orders")
def orders_create():
    """Phase 2A: basic submit endpoint.

    Full transaction + stock decrement will be implemented in Phase 2A/2B logic later.
    For now we validate input shape and reject obviously bad submissions.
    """

    customer_id = _parse_int((request.form.get("customer_id") or "").strip())

    product_ids = request.form.getlist("product_id")
    quantities = request.form.getlist("quantity")
    prices = request.form.getlist("price")

    if not customer_id:
        flash("Please select a customer", "error")
        return redirect(url_for("orders.orders_new_form"))

    if not product_ids:
        flash("Please add at least one order item", "error")
        return redirect(url_for("orders.orders_new_form"))

    items: list[tuple[int, int, Decimal | None]] = []
    for i, pid_raw in enumerate(product_ids):
        pid = _parse_int(pid_raw)
        qty = _parse_int(quantities[i] if i < len(quantities) else "")
        price = _parse_decimal(prices[i] if i < len(prices) else "")

        if not pid:
            flash("Each item must have a product", "error")
            return redirect(url_for("orders.orders_new_form"))
        if qty is None or qty <= 0:
            flash("Quantity must be > 0 for each item", "error")
            return redirect(url_for("orders.orders_new_form"))
        if price is None or price < 0:
            flash("Price must be >= 0 for each item", "error")
            return redirect(url_for("orders.orders_new_form"))

        items.append((pid, qty, price))

    # Phase 2A UI milestone: do not write to DB yet.
    # (Phase 2 transaction/stock logic will insert Orders + Order_Details and decrement Product.quantity.)
    flash("Order submit captured (DB save will be implemented in Phase 2 transaction logic)", "success")
    return redirect(url_for("orders.orders_new_form"))
