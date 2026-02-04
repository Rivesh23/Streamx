import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "library.db")

def migrate():
    print(f"Connecting to {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Check if last_updated exists in progress
    c.execute("PRAGMA table_info(progress)")
    columns = [col[1] for col in c.fetchall()]
    
    if "last_updated" not in columns:
        print("Adding 'last_updated' column to 'progress' table...")
        c.execute("ALTER TABLE progress ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP")
        conn.commit()
        print("Migration successful.")
    else:
        print("'last_updated' column already exists.")
    
    conn.close()

if __name__ == "__main__":
    migrate()
