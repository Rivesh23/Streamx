import sys, os
sys.path.insert(0, 'backend')

import sqlite3
db_file = os.path.join('backend', 'library.db')

conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print('Tables:', tables)

user_id = 'test-user'
tmdb_id = 1668

try:
    c.execute("SELECT 1 FROM watchlist WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
    print('Watchlist query OK:', c.fetchone())
except Exception as e:
    print('Watchlist query FAILED:', e)

# Check user_data.db
conn.close()

db2 = os.path.join('backend', 'user_data.db')
if os.path.exists(db2):
    conn2 = sqlite3.connect(db2)
    c2 = conn2.cursor()
    c2.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print('user_data.db tables:', [r[0] for r in c2.fetchall()])
    conn2.close()

# Now reproduce the full endpoint
from db_manager import get_db, init_db
init_db()

with get_db() as conn3:
    c3 = conn3.cursor()
    c3.execute("SELECT 1 FROM watchlist WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
    print('Full get_db watchlist OK:', c3.fetchone())
