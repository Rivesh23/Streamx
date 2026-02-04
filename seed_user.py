import sqlite3
import os
from passlib.context import CryptContext

DB_FILE = os.path.join(os.path.dirname(__file__), "backend", "library.db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    if not os.path.exists(DB_FILE):
        print(f"Database not found at {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    email = "luca@irongate.io"
    password = "password123"
    hashed_pw = pwd_context.hash(password)
    
    try:
        c.execute("INSERT OR REPLACE INTO users (email, password_hash) VALUES (?, ?)", (email, hashed_pw))
        conn.commit()
        print(f"Successfully seeded: {email} / {password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
