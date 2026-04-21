import mysql.connector


def test_connection():
    try:
        connection = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="aniam@1605",
            database="SalesInventoryDB",
        )

        if connection.is_connected():
            print("✅ Successfully connected to the MySQL database!")

            cursor = connection.cursor()
            cursor.execute("SELECT * FROM Product LIMIT 3;")
            records = cursor.fetchall()

            print("\nHere are your first 3 products:")
            for row in records:
                print(row)

    except mysql.connector.Error as e:
        print(f"❌ Error connecting to MySQL: {e}")

    finally:
        if "connection" in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔒 MySQL connection is closed.")


if __name__ == "__main__":
    test_connection()
