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
