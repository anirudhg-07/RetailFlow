from flask import Blueprint, flash, redirect, render_template, request, url_for

from db import get_connection

bp = Blueprint("suppliers", __name__, url_prefix="")


def _is_valid_email(email: str) -> bool:
    # Lightweight validation ("optional" per PRD): just enough to catch obvious mistakes.
    # Allow None/empty upstream.
    return ("@" in email) and ("." in email.split("@", 1)[-1])


@bp.get("/suppliers")
def suppliers_list():
    q = (request.args.get("q") or "").strip()

    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        if q:
            like = f"%{q}%"
            cur.execute(
                """
                SELECT supplier_id, supplier_name, phone, email, address
                FROM Supplier
                WHERE supplier_name LIKE %s
                   OR phone LIKE %s
                   OR email LIKE %s
                ORDER BY supplier_id DESC
                LIMIT 500
                """,
                (like, like, like),
            )
        else:
            cur.execute(
                """
                SELECT supplier_id, supplier_name, phone, email, address
                FROM Supplier
                ORDER BY supplier_id DESC
                LIMIT 500
                """
            )
        suppliers = cur.fetchall()
        return render_template("suppliers/list.html", suppliers=suppliers, q=q)
    finally:
        conn.close()


@bp.post("/suppliers")
def suppliers_create():
    name = (request.form.get("supplier_name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    email = (request.form.get("email") or "").strip() or None
    address = (request.form.get("address") or "").strip()

    if not name or not phone or not address:
        flash("Supplier name, phone, and address are required", "error")
        return redirect(url_for("suppliers.suppliers_list"))

    if email and not _is_valid_email(email):
        flash("Please enter a valid email address (or leave it blank)", "error")
        return redirect(url_for("suppliers.suppliers_list"))

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO Supplier (supplier_name, phone, email, address)
            VALUES (%s, %s, %s, %s)
            """,
            (name, phone, email, address),
        )
        conn.commit()
        flash("Supplier added", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not add supplier: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("suppliers.suppliers_list"))


@bp.get("/suppliers/<int:supplier_id>/edit")
def suppliers_edit_form(supplier_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT supplier_id, supplier_name, phone, email, address
            FROM Supplier
            WHERE supplier_id = %s
            """,
            (supplier_id,),
        )
        supplier = cur.fetchone()
        if not supplier:
            flash("Supplier not found", "error")
            return redirect(url_for("suppliers.suppliers_list"))

        return render_template("suppliers/edit.html", supplier=supplier)
    finally:
        conn.close()


@bp.post("/suppliers/<int:supplier_id>/edit")
def suppliers_update(supplier_id: int):
    name = (request.form.get("supplier_name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    email = (request.form.get("email") or "").strip() or None
    address = (request.form.get("address") or "").strip()

    if not name or not phone or not address:
        flash("Supplier name, phone, and address are required", "error")
        return redirect(url_for("suppliers.suppliers_edit_form", supplier_id=supplier_id))

    if email and not _is_valid_email(email):
        flash("Please enter a valid email address (or leave it blank)", "error")
        return redirect(url_for("suppliers.suppliers_edit_form", supplier_id=supplier_id))

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE Supplier
            SET supplier_name=%s, phone=%s, email=%s, address=%s
            WHERE supplier_id=%s
            """,
            (name, phone, email, address, supplier_id),
        )
        conn.commit()
        flash("Supplier updated", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not update supplier: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("suppliers.suppliers_list"))


@bp.post("/suppliers/<int:supplier_id>/delete")
def suppliers_delete(supplier_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Block delete if referenced by Product
        cur.execute("SELECT COUNT(*) FROM Product WHERE supplier_id = %s", (supplier_id,))
        (count,) = cur.fetchone()
        if count and count > 0:
            flash("Can't delete supplier: supplier is used by one or more products", "error")
            return redirect(url_for("suppliers.suppliers_list"))

        cur.execute("DELETE FROM Supplier WHERE supplier_id=%s", (supplier_id,))
        conn.commit()
        flash("Supplier deleted", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not delete supplier: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("suppliers.suppliers_list"))
