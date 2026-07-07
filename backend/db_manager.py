import sqlite3
import os
from contextlib import contextmanager
from logger import log

DB_DIR = os.getenv("DATA_DIR", os.path.dirname(__file__))
DB_FILE = os.path.join(DB_DIR, "library.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    try:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA synchronous=NORMAL')
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        log.error(f"Database transaction error: {e}")
        raise
    finally:
        conn.close()

def init_db():
    try:
        with get_db() as conn:
            c = conn.cursor()
            
            # --- Core Tables ---
            c.execute('''CREATE TABLE IF NOT EXISTS library 
                         (user_id TEXT, tmdb_id INTEGER, type TEXT, title TEXT, file_path TEXT,
                          PRIMARY KEY (user_id, tmdb_id))''')
            c.execute('''CREATE TABLE IF NOT EXISTS progress 
                         (user_id TEXT, tmdb_id INTEGER, time REAL, watched INTEGER, 
                          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (user_id, tmdb_id))''')
            c.execute('''CREATE TABLE IF NOT EXISTS favorites 
                         (user_id TEXT, tmdb_id INTEGER, type TEXT, title TEXT, 
                          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (user_id, tmdb_id))''')

            # --- New Tables ---

            # Ratings
            c.execute('''CREATE TABLE IF NOT EXISTS ratings
                         (user_id TEXT, tmdb_id INTEGER, type TEXT, rating REAL, 
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (user_id, tmdb_id))''')

            # Watchlist (separate from favorites)
            c.execute('''CREATE TABLE IF NOT EXISTS watchlist
                         (user_id TEXT, tmdb_id INTEGER, type TEXT, title TEXT,
                          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (user_id, tmdb_id))''')

            # Watch history (every play recorded)
            c.execute('''CREATE TABLE IF NOT EXISTS watch_history
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          user_id TEXT, tmdb_id INTEGER, type TEXT, title TEXT,
                          watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          duration REAL DEFAULT 0)''')

            # User preferences
            c.execute('''CREATE TABLE IF NOT EXISTS user_preferences
                         (user_id TEXT PRIMARY KEY,
                          language TEXT DEFAULT 'en',
                          subtitle_lang TEXT DEFAULT 'off',
                          autoplay_next INTEGER DEFAULT 1,
                          maturity_level TEXT DEFAULT 'all',
                          default_source TEXT DEFAULT '2embed',
                          theme TEXT DEFAULT 'dark',
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

            # Search history
            c.execute('''CREATE TABLE IF NOT EXISTS search_history
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          user_id TEXT, query TEXT,
                          searched_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

            # Notifications
            c.execute('''CREATE TABLE IF NOT EXISTS notifications
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          user_id TEXT, title TEXT, message TEXT, type TEXT DEFAULT 'info',
                          is_read INTEGER DEFAULT 0,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

            # --- Migration: add file_path to library if missing ---
            c.execute("PRAGMA table_info(library)")
            cols = [col[1] for col in c.fetchall()]
            if 'file_path' not in cols:
                log.info("Migrating 'library' table to include 'file_path'...")
                c.execute("ALTER TABLE library ADD COLUMN file_path TEXT")

            # --- Migration: add added_at to favorites if missing ---
            c.execute("PRAGMA table_info(favorites)")
            cols = [col[1] for col in c.fetchall()]
            if 'added_at' not in cols:
                try:
                    c.execute("ALTER TABLE favorites ADD COLUMN added_at DATETIME DEFAULT CURRENT_TIMESTAMP")
                except:
                    pass

            # --- Indexes for performance ---
            c.execute("CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_history_user ON watch_history(user_id)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)")

            log.info("Database initialized successfully (v2).")
    except Exception as e:
        log.critical(f"Failed to initialize database: {e}")
