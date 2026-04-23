"""Manual smoke script for POST /api/orders.

Requires DB credentials in environment/.env.

Usage (from backend/):
  python scripts/manual_create_order_api.py

Adjust payload in the script as needed.
"""

from app import create_app


def main() -> None:
    app = create_app()
    client = app.test_client()

    payload = {
        "customer_id": None,  # set to a real customer_id if you want
        "items": [
            {"product_id": 1, "quantity": 1},
        ],
    }

    resp = client.post("/api/orders", json=payload)
    print("status:", resp.status_code)
    print(resp.get_json())


if __name__ == "__main__":
    main()
