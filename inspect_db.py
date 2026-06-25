import sqlite3
from logger import logger

def inspect():
    try:
        conn = sqlite3.connect("Backend/sugarcane_erp.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables in sugarcane_erp.db:")
        for table in tables:
            name = table[0]
            print(f"\nTable: {name}")
            cursor.execute(f"PRAGMA table_info({name});")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  Column: {col[1]} ({col[2]})")
            
            # Select first 3 rows
            try:
                cursor.execute(f"SELECT * FROM {name} LIMIT 3;")
                rows = cursor.fetchall()
                logger.info(f"  Sample Rows (max 3): {rows}")
            except Exception as e:
                logger.error(f"  Error reading rows: {e}")
        conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {e}", exc_info=True)

if __name__ == "__main__":
    inspect()
