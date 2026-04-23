import os
import sys


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app


def test_create_order_requires_items():
    app = create_app()
    client = app.test_client()

    resp = client.post("/api/orders", json={"customer_id": 1, "items": []})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data and data["ok"] is False


def test_create_order_rejects_bad_quantity():
    app = create_app()
    client = app.test_client()

    resp = client.post(
        "/api/orders",
        json={"customer_id": 1, "items": [{"product_id": 1, "quantity": 0}]},
    )
    assert resp.status_code == 400

def test_get_order_not_found_returns_404(monkeypatch):
    # DB-independent test by monkeypatching get_connection used by api.py
    import api as api_module

    class _Cur:
        def execute(self, *_args, **_kwargs):
            return None

        def fetchone(self):
            return None

        def fetchall(self):
            return []

    class _Conn:
        def cursor(self, dictionary=False):
            return _Cur()

        def close(self):
            return None

    monkeypatch.setattr(api_module, "get_connection", lambda: _Conn())

    app = create_app()
    client = app.test_client()

    resp = client.get("/api/orders/999999")
    assert resp.status_code == 404


def test_top_products_report_returns_ok(monkeypatch):
    import api as api_module

    class _Cur:
        def __init__(self):
            self._rows = [
                {
                    "product_id": 1,
                    "product_name": "Test Product",
                    "category": "Test",
                    "total_qty_sold": 5,
                    "total_revenue": 50,
                }
            ]

        def execute(self, *_args, **_kwargs):
            return None

        def fetchall(self):
            return self._rows

        def fetchone(self):
            return None

    class _Conn:
        def cursor(self, dictionary=False):
            return _Cur()

        def close(self):
            return None

    monkeypatch.setattr(api_module, "get_connection", lambda: _Conn())

    app = create_app()
    client = app.test_client()

    resp = client.get("/api/reports/top-products?limit=5")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["ok"] is True
    assert isinstance(data["results"], list)
