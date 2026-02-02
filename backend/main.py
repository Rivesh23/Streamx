from fastapi import FastAPI, HTTPException, Header
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

DB_FILE = os.path.join(os.path.dirname(__file__), "library.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS library 
                 (tmdb_id INTEGER PRIMARY KEY, type TEXT, title TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS progress 
                 (tmdb_id INTEGER PRIMARY KEY, time REAL, watched INTEGER)''')
    
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
    conn.close()

init_db()
tmdb.init_cache()

class Progress(BaseModel):
    tmdb_id: int
    time: float
    watched: bool

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

@app.post("/api/progress")
def save_progress(p: Progress):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO progress (tmdb_id, time, watched) VALUES (?, ?, ?)", 
              (p.tmdb_id, p.time, 1 if p.watched else 0))
    conn.commit()
    conn.close()
    return {"status": "ok"}

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
def get_discover(media_type: str = "movie"):
    results = tmdb.get_discover(media_type)
    return process_tmdb_results(results)

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

app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "frontend-new", "dist"), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
