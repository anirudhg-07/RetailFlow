import os

from dotenv import load_dotenv
from flask import Flask


def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")

    # Blueprints
    from suppliers import bp as suppliers_bp
    from products import bp as products_bp
    from customers import bp as customers_bp

    app.register_blueprint(suppliers_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)

    @app.get("/")
    def home():
        # redirect kept minimal for now
        return (
            "<h2>Inventory System</h2>"
            "<p><a href='/suppliers'>Go to Suppliers</a></p>"
            "<p><a href='/products'>Go to Products</a></p>"
            "<p><a href='/customers'>Go to Customers</a></p>"
        )

    @app.get("/api/health")
    def health():
        # DB health: connect + SELECT 1
        try:
            from db import get_connection

            conn = get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT 1")
                (one,) = cur.fetchone()
                return {"ok": True, "db": True, "result": int(one)}
            finally:
                conn.close()
        except Exception as e:
            return {"ok": False, "db": False, "error": str(e)}, 500

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
