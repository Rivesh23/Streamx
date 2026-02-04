from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import tmdb

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_DIR = os.getenv("DATA_DIR", os.path.dirname(__file__))
DB_FILE = os.path.join(DB_DIR, "library.db")

from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

# Auth Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "aethernex_super_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 days

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS library 
                 (tmdb_id INTEGER PRIMARY KEY, type TEXT, title TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS progress 
                 (tmdb_id INTEGER PRIMARY KEY, time REAL, watched INTEGER, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password_hash TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS favorites 
                 (tmdb_id INTEGER PRIMARY KEY, type TEXT, title TEXT)''')
    
    # Defaults
    c.execute("SELECT count(*) FROM library")
    if c.fetchone()[0] == 0:
        defaults = [
            (27205, "movie", "Inception"),
            (603, "movie", "The Matrix"),
            (157336, "movie", "Interstellar"),
            (1396, "tv", "Breaking Bad"),
            (66732, "tv", "Stranger Things")
        ]
        c.executemany("INSERT INTO library (tmdb_id, type, title) VALUES (?, ?, ?)", defaults)
        conn.commit()

    # Auto-seed default user if none exists
    c.execute("SELECT count(*) FROM users")
    if c.fetchone()[0] == 0:
        email = "luca@irongate.io"
        password = "password123"
        hashed_pw = get_password_hash(password)
        c.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, hashed_pw))
        conn.commit()

    # Migration: Check if last_updated exists in progress
    c.execute("PRAGMA table_info(progress)")
    columns = [col[1] for col in c.fetchall()]
    if "last_updated" not in columns:
        c.execute("ALTER TABLE progress ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP")
        conn.commit()

    # Auto-seed default user if none exists
    c.execute("SELECT count(*) FROM users")
    if c.fetchone()[0] == 0:
        email = "luca@irongate.io"
        password = "password123"
        hashed_pw = get_password_hash(password)
        c.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, hashed_pw))
        conn.commit()
    else:
        # Check if the existing user is the default one and update its hash if needed
        # (Optional: just ensure it's there)
        pass

    conn.close()

init_db()
tmdb.init_cache()

class UserAuth(BaseModel):
    email: str
    password: str

class Progress(BaseModel):
    tmdb_id: int
    time: float
    watched: bool
    type: Optional[str] = None
    title: Optional[str] = None

@app.post("/api/register")
def register(user: UserAuth):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    hashed_pw = get_password_hash(user.password)
    try:
        c.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (user.email, hashed_pw))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    conn.close()
    return {"status": "User created"}

@app.post("/api/login")
def login(user: UserAuth):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE email=?", (user.email,))
    row = c.fetchone()
    conn.close()
    
    if not row or not verify_password(user.password, row[0]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/media")
def get_media():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT tmdb_id, type, title FROM library")
    rows = c.fetchall()
    conn.close()

    media_list = []
    for r in rows:
        tmdb_id, mtype, title = r
        meta = tmdb.get_details(tmdb_id, mtype)
            
        poster = None
        backdrop = None
        overview = "No description."
        
        if meta:
            poster = f"https://image.tmdb.org/t/p/w500{meta.get('poster_path')}" if meta.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{meta.get('backdrop_path')}" if meta.get('backdrop_path') else None
            overview = meta.get('overview')

        media_list.append({
            "tmdb_id": tmdb_id,
            "type": mtype,
            "title": title,
            "poster": poster,
            "backdrop": backdrop,
            "overview": overview
        })
    return media_list

@app.get("/api/search")
def search(q: str):
    results = tmdb.search_multi(q)
    processed = []
    if 'results' in results:
        for item in results['results']:
            if item['media_type'] not in ['movie', 'tv']: continue
            
            poster = f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None
            
            processed.append({
                "tmdb_id": item['id'],
                "type": item['media_type'],
                "title": item.get('title') or item.get('name'),
                "poster": poster,
                "backdrop": backdrop,
                "overview": item.get('overview')
            })
    return processed

@app.get("/api/tv/{tmdb_id}/details")
def get_tv_details(tmdb_id: int):
    # Returns seasons/episodes structure
    return tmdb.get_tv_seasons(tmdb_id)

@app.post("/api/library/add")
def add_to_library(item: dict):
    # item = {tmdb_id, type, title}
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO library (tmdb_id, type, title) VALUES (?, ?, ?)", 
                  (item['tmdb_id'], item['type'], item['title']))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Already exists
    conn.close()
    return {"status": "ok"}

@app.get("/api/favorites")
def get_favorites():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT tmdb_id, type, title FROM favorites")
    rows = c.fetchall()
    conn.close()

    fav_list = []
    for r in rows:
        tmdb_id, mtype, title = r
        meta = tmdb.get_details(tmdb_id, mtype)
        
        poster = None
        backdrop = None
        if meta:
            poster = f"https://image.tmdb.org/t/p/w500{meta.get('poster_path')}" if meta.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{meta.get('backdrop_path')}" if meta.get('backdrop_path') else None

        fav_list.append({
            "tmdb_id": tmdb_id,
            "type": mtype,
            "title": title,
            "poster": poster,
            "backdrop": backdrop,
            "overview": meta.get('overview') if meta else "No description."
        })
    return fav_list

@app.post("/api/favorites/toggle")
def toggle_favorite(item: dict):
    # item = {tmdb_id, type, title}
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT 1 FROM favorites WHERE tmdb_id=?", (item['tmdb_id'],))
    exists = c.fetchone()
    
    status = "added"
    if exists:
        c.execute("DELETE FROM favorites WHERE tmdb_id=?", (item['tmdb_id'],))
        status = "removed"
    else:
        c.execute("INSERT INTO favorites (tmdb_id, type, title) VALUES (?, ?, ?)", 
                  (item['tmdb_id'], item['type'], item['title']))
        status = "added"
    
    conn.commit()
    conn.close()
    return {"status": status}

@app.get("/api/favorites/check/{tmdb_id}")
def check_favorite(tmdb_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT 1 FROM favorites WHERE tmdb_id=?", (tmdb_id,))
    exists = c.fetchone()
    conn.close()
    return {"is_favorite": bool(exists)}

@app.post("/api/progress")
def save_progress(p: Progress):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # NEW: Resiliency - ensure item exists in library for the JOIN to work
    if p.type and p.title:
        try:
            c.execute("INSERT OR IGNORE INTO library (tmdb_id, type, title) VALUES (?, ?, ?)", 
                      (p.tmdb_id, p.type, p.title))
        except:
            pass

    c.execute("INSERT OR REPLACE INTO progress (tmdb_id, time, watched, last_updated) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", 
              (p.tmdb_id, p.time, 1 if p.watched else 0))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/continue-watching")
def get_continue_watching():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Get items with progress, joined with library to get type and title
    query = """
    SELECT p.tmdb_id, l.type, l.title 
    FROM progress p 
    LEFT JOIN library l ON p.tmdb_id = l.tmdb_id 
    WHERE p.watched = 0 
    ORDER BY p.last_updated DESC 
    LIMIT 20
    """
    c.execute(query)
    rows = c.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        tmdb_id, mtype, title = r
        mtype = mtype or "movie" # Fallback if not in library
        
        # Get progress
        c = sqlite3.connect(DB_FILE).cursor()
        c.execute("SELECT time FROM progress WHERE tmdb_id=?", (tmdb_id,))
        prog_row = c.fetchone()
        progress_val = prog_row[0] if prog_row else 0
        
        meta = tmdb.get_details(tmdb_id, mtype)
        if meta:
            poster = f"https://image.tmdb.org/t/p/w500{meta.get('poster_path')}" if meta.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{meta.get('backdrop_path')}" if meta.get('backdrop_path') else None
            results.append({
                "tmdb_id": tmdb_id,
                "type": mtype,
                "title": title or meta.get('title') or meta.get('name'),
                "poster": poster,
                "backdrop": backdrop,
                "overview": meta.get('overview'),
                "progress": progress_val
            })
    return results


@app.get("/api/progress/{tmdb_id}")
def get_progress(tmdb_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT time, watched FROM progress WHERE tmdb_id=?", (tmdb_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"time": row[0], "watched": bool(row[1])}
    return {"time": 0, "watched": False}

@app.get("/api/trending")
def get_trending(media_type: str = "all"):
    results = tmdb.get_trending(media_type)
    return process_tmdb_results(results)

@app.get("/api/discover")
def get_discover(media_type: str = "movie", genre_id: int = None):
    results = tmdb.get_discover(media_type, genre_id=genre_id)
    return process_tmdb_results(results)

@app.get("/api/genres")
def get_genres(media_type: str = "movie"):
    return tmdb.get_genres(media_type)


def process_tmdb_results(results):
    processed = []
    if 'results' in results:
        for item in results['results']:
            if item.get('media_type') not in ['movie', 'tv', None]: continue
            
            # Media type might be missing in discover results
            mtype = item.get('media_type') or ("movie" if "title" in item else "tv")
            
            poster = f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None
            
            processed.append({
                "tmdb_id": item['id'],
                "type": mtype,
                "title": item.get('title') or item.get('name'),
                "poster": poster,
                "backdrop": backdrop,
                "overview": item.get('overview')
            })
    return processed

# Mount static files for assets (js, css, etc)
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    # Check if this is an API call
    if full_path.startswith("api"):
        raise HTTPException(status_code=404)
        
    # Check if the requested path is a direct file in dist (like favicon.ico)
    full_file_path = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(full_file_path):
        return FileResponse(full_file_path)
        
    # Fallback to index.html for SPA routing (e.g., /login, /profile)
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="SPA Index not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
