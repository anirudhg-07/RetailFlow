from __future__ import annotations

from flask import Blueprint, flash, redirect, render_template, request, url_for

from db import get_connection

bp = Blueprint("customers", __name__, url_prefix="")


@bp.get("/customers")
def customers_list():
    q = (request.args.get("q") or "").strip()

    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        if q:
            like = f"%{q}%"
            cur.execute(
                """
                SELECT customer_id, customer_name, phone, email
                FROM Customer
                WHERE customer_name LIKE %s
                   OR phone LIKE %s
                   OR email LIKE %s
                ORDER BY customer_id DESC
                LIMIT 500
                """,
                (like, like, like),
            )
        else:
            cur.execute(
                """
                SELECT customer_id, customer_name, phone, email
                FROM Customer
                ORDER BY customer_id DESC
                LIMIT 500
                """
            )
        customers = cur.fetchall()
        return render_template("customers/list.html", customers=customers, q=q)
    finally:
        conn.close()


@bp.post("/customers")
def customers_create():
    name = (request.form.get("customer_name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    email = (request.form.get("email") or "").strip() or None

    if not name or not phone:
        flash("Customer name and phone are required", "error")
        return redirect(url_for("customers.customers_list"))

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO Customer (customer_name, phone, email)
            VALUES (%s, %s, %s)
            """,
            (name, phone, email),
        )
        conn.commit()
        flash("Customer added", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not add customer: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("customers.customers_list"))


@bp.get("/customers/<int:customer_id>/edit")
def customers_edit_form(customer_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT customer_id, customer_name, phone, email
            FROM Customer
            WHERE customer_id=%s
            """,
            (customer_id,),
        )
        customer = cur.fetchone()
        if not customer:
            flash("Customer not found", "error")
            return redirect(url_for("customers.customers_list"))

        return render_template("customers/edit.html", customer=customer)
    finally:
        conn.close()


@bp.post("/customers/<int:customer_id>/edit")
def customers_update(customer_id: int):
    name = (request.form.get("customer_name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    email = (request.form.get("email") or "").strip() or None

    if not name or not phone:
        flash("Customer name and phone are required", "error")
        return redirect(url_for("customers.customers_edit_form", customer_id=customer_id))

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE Customer
            SET customer_name=%s, phone=%s, email=%s
            WHERE customer_id=%s
            """,
            (name, phone, email, customer_id),
        )
        conn.commit()
        flash("Customer updated", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not update customer: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("customers.customers_list"))


@bp.post("/customers/<int:customer_id>/delete")
def customers_delete(customer_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Block delete if referenced by Orders
        cur.execute("SELECT COUNT(*) FROM Orders WHERE customer_id = %s", (customer_id,))
        (count,) = cur.fetchone()
        if count and count > 0:
            flash("Can't delete customer: customer is used by one or more orders", "error")
            return redirect(url_for("customers.customers_list"))

        cur.execute("DELETE FROM Customer WHERE customer_id=%s", (customer_id,))
        conn.commit()
        flash("Customer deleted", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not delete customer: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("customers.customers_list"))
