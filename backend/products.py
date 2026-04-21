from __future__ import annotations

from decimal import Decimal, InvalidOperation

from flask import Blueprint, flash, redirect, render_template, request, url_for

from db import get_connection

bp = Blueprint("products", __name__, url_prefix="")


def _parse_decimal(value: str) -> Decimal | None:
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        return None


def _parse_int(value: str) -> int | None:
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


@bp.get("/products")
def products_list():
    q = (request.args.get("q") or "").strip()
    category = (request.args.get("category") or "").strip()

    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        where = []
        params: list[object] = []

        if q:
            where.append("p.product_name LIKE %s")
            params.append(f"%{q}%")

        if category:
            where.append("p.category = %s")
            params.append(category)

        where_sql = ("WHERE " + " AND ".join(where)) if where else ""

        cur.execute(
            f"""
            SELECT
                p.product_id,
                p.product_name,
                p.category,
                p.price,
                p.quantity,
                p.supplier_id,
                s.supplier_name
            FROM Product p
            LEFT JOIN Supplier s ON s.supplier_id = p.supplier_id
            {where_sql}
            ORDER BY p.product_id DESC
            LIMIT 500
            """,
            tuple(params),
        )
        products = cur.fetchall()

        # categories dropdown
        cur.execute(
            """
            SELECT DISTINCT category
            FROM Product
            WHERE category IS NOT NULL AND category <> ''
            ORDER BY category
            """
        )
        categories = [row["category"] for row in cur.fetchall()]

        # suppliers for create form
        cur.execute(
            """
            SELECT supplier_id, supplier_name
            FROM Supplier
            ORDER BY supplier_name
            """
        )
        suppliers = cur.fetchall()

        return render_template(
            "products/list.html",
            products=products,
            q=q,
            category=category,
            categories=categories,
            suppliers=suppliers,
        )
    finally:
        conn.close()


@bp.post("/products")
def products_create():
    name = (request.form.get("product_name") or "").strip()
    category = (request.form.get("category") or "").strip()
    price_raw = (request.form.get("price") or "").strip()
    qty_raw = (request.form.get("quantity") or "").strip()
    supplier_raw = (request.form.get("supplier_id") or "").strip()

    price = _parse_decimal(price_raw)
    qty = _parse_int(qty_raw)

    supplier_id = _parse_int(supplier_raw) if supplier_raw else None

    if not name or not category:
        flash("Product name and category are required", "error")
        return redirect(url_for("products.products_list"))

    if price is None or price < 0:
        flash("Price must be a number >= 0", "error")
        return redirect(url_for("products.products_list"))

    if qty is None or qty < 0:
        flash("Quantity must be an integer >= 0", "error")
        return redirect(url_for("products.products_list"))

    conn = get_connection()
    try:
        cur = conn.cursor()

        if supplier_id is not None:
            cur.execute("SELECT 1 FROM Supplier WHERE supplier_id=%s", (supplier_id,))
            if not cur.fetchone():
                flash("Selected supplier does not exist", "error")
                return redirect(url_for("products.products_list"))

        cur.execute(
            """
            INSERT INTO Product (product_name, category, price, quantity, supplier_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (name, category, str(price), qty, supplier_id),
        )
        conn.commit()
        flash("Product added", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not add product: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("products.products_list"))


@bp.get("/products/<int:product_id>/edit")
def products_edit_form(product_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT product_id, product_name, category, price, quantity, supplier_id
            FROM Product
            WHERE product_id=%s
            """,
            (product_id,),
        )
        product = cur.fetchone()
        if not product:
            flash("Product not found", "error")
            return redirect(url_for("products.products_list"))

        cur.execute(
            """
            SELECT supplier_id, supplier_name
            FROM Supplier
            ORDER BY supplier_name
            """
        )
        suppliers = cur.fetchall()

        return render_template("products/edit.html", product=product, suppliers=suppliers)
    finally:
        conn.close()


@bp.post("/products/<int:product_id>/edit")
def products_update(product_id: int):
    name = (request.form.get("product_name") or "").strip()
    category = (request.form.get("category") or "").strip()
    price_raw = (request.form.get("price") or "").strip()
    qty_raw = (request.form.get("quantity") or "").strip()
    supplier_raw = (request.form.get("supplier_id") or "").strip()

    price = _parse_decimal(price_raw)
    qty = _parse_int(qty_raw)
    supplier_id = _parse_int(supplier_raw) if supplier_raw else None

    if not name or not category:
        flash("Product name and category are required", "error")
        return redirect(url_for("products.products_edit_form", product_id=product_id))

    if price is None or price < 0:
        flash("Price must be a number >= 0", "error")
        return redirect(url_for("products.products_edit_form", product_id=product_id))

    if qty is None or qty < 0:
        flash("Quantity must be an integer >= 0", "error")
        return redirect(url_for("products.products_edit_form", product_id=product_id))

    conn = get_connection()
    try:
        cur = conn.cursor()

        if supplier_id is not None:
            cur.execute("SELECT 1 FROM Supplier WHERE supplier_id=%s", (supplier_id,))
            if not cur.fetchone():
                flash("Selected supplier does not exist", "error")
                return redirect(url_for("products.products_edit_form", product_id=product_id))

        cur.execute(
            """
            UPDATE Product
            SET product_name=%s, category=%s, price=%s, quantity=%s, supplier_id=%s
            WHERE product_id=%s
            """,
            (name, category, str(price), qty, supplier_id, product_id),
        )
        conn.commit()
        flash("Product updated", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not update product: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("products.products_list"))


@bp.post("/products/<int:product_id>/delete")
def products_delete(product_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Block delete if referenced by Order_Details
        cur.execute(
            "SELECT COUNT(*) FROM Order_Details WHERE product_id = %s",
            (product_id,),
        )
        (count,) = cur.fetchone()
        if count and count > 0:
            flash("Can't delete product: product is used by one or more order items", "error")
            return redirect(url_for("products.products_list"))

        cur.execute("DELETE FROM Product WHERE product_id=%s", (product_id,))
        conn.commit()
        flash("Product deleted", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Could not delete product: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for("products.products_list"))
