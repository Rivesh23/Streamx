import os
import re
import jwt
import asyncio
import urllib.request
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, Request, Depends, BackgroundTasks, status
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3

import tmdb
import audio
from logger import log
from db_manager import init_db, get_db

app = FastAPI(title="StreamX API")

# Initialize Cache & DB
tmdb.init_cache()
init_db()

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.head("/health")
@app.get("/api/health")
@app.head("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.on_event("startup")
async def start_keep_alive():
    target_url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("KEEP_ALIVE_URL")
    if target_url:
        ping_url = target_url.rstrip("/") + "/health" if not target_url.endswith("/health") else target_url
        async def ping_loop():
            log.info(f"Starting keep-alive background pinger targeting {ping_url}")
            while True:
                await asyncio.sleep(600)  # Ping every 10 minutes
                try:
                    req = urllib.request.Request(ping_url, headers={"User-Agent": "StreamX-KeepAlive/1.0"})
                    urllib.request.urlopen(req, timeout=10)
                    log.info(f"Keep-alive ping sent to {ping_url}")
                except Exception as e:
                    log.warning(f"Keep-alive ping error: {e}")
        asyncio.create_task(ping_loop())

# --- Exception Handling ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# --- Authentication ---
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

class UserLogin(BaseModel):
    username: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), x_user_id: Optional[str] = Header(None)):
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid auth token")
            return user_id
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid auth token")
    # Legacy fallback for spoofing / transition. In prod, we should block this.
    if x_user_id:
        return x_user_id
    raise HTTPException(status_code=401, detail="Not authenticated")

@app.post("/api/login")
def login(user: UserLogin):
    # Dummy auth for now - replace with actual passlib check against user DB
    if user.username and len(user.password) >= 3:
        token = create_access_token({"sub": user.username})
        return {"access_token": token, "token_type": "bearer", "user_id": user.username}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/register")
def register(user: UserLogin):
    # Dummy auth for now
    if user.username and len(user.password) >= 3:
        token = create_access_token({"sub": user.username})
        return {"access_token": token, "token_type": "bearer", "user_id": user.username}
    raise HTTPException(status_code=400, detail="Invalid registration data")

# --- Models ---
class Progress(BaseModel):
    tmdb_id: int
    time: float
    watched: bool
    type: Optional[str] = None
    title: Optional[str] = None

# --- Helper: Batch TMDB Fetching ---
def enrich_media_list(items):
    # Batch enrichment to avoid N+1 if we have a bulk API, but TMDB doesn't natively bulk.
    # We still loop, but we rely heavily on our fast local SQLite cache.
    result = []
    for item in items:
        tmdb_id, mtype, title, file_path = item[0], item[1], item[2], item[3] if len(item) > 3 else None
        meta = tmdb.get_details(tmdb_id, mtype)
        
        poster = None
        backdrop = None
        overview = "No description."
        
        if meta:
            poster = f"https://image.tmdb.org/t/p/w500{meta.get('poster_path')}" if meta.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{meta.get('backdrop_path')}" if meta.get('backdrop_path') else None
            overview = meta.get('overview', "No description.")

        result.append({
            "tmdb_id": tmdb_id,
            "type": mtype,
            "title": title or (meta.get('title') or meta.get('name') if meta else "Unknown"),
            "poster": poster,
            "backdrop": backdrop,
            "overview": overview,
            "is_local": file_path is not None
        })
    return result

# --- Routes ---

@app.get("/api/health")
def health_check():
    tmdb_ok = tmdb.check_health()
    return {"status": "ok", "tmdb_api": "connected" if tmdb_ok else "degraded or invalid key"}

@app.get("/api/media")
def get_media(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT tmdb_id, type, title, file_path FROM library WHERE user_id=? OR user_id='local'", (user_id,))
        rows = c.fetchall()
    return enrich_media_list(rows)

@app.get("/api/search")
def search(q: str):
    results = tmdb.search_multi(q)
    processed = []
    if 'results' in results:
        for item in results['results']:
            if item.get('media_type') not in ['movie', 'tv']: continue
            
            poster = f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None
            
            processed.append({
                "tmdb_id": item.get('id'),
                "type": item.get('media_type'),
                "title": item.get('title') or item.get('name'),
                "poster": poster,
                "backdrop": backdrop,
                "overview": item.get('overview')
            })
    return processed

@app.get("/api/tv/{tmdb_id}/details")
def get_tv_details(tmdb_id: int):
    return tmdb.get_tv_seasons(tmdb_id)

@app.get("/api/tv/{tmdb_id}/season/{season_number}")
def get_tv_season(tmdb_id: int, season_number: int):
    return tmdb.get_tv_season_episodes(tmdb_id, season_number)

@app.get("/api/audio/search")
def search_audio(q: str, source: str = "all"):
    if source == "youtube":
        return audio.search_youtube_audio(q)
    elif source == "saavn":
        return audio.search_saavn_audio(q)
    else:
        saavn_results = audio.search_saavn_audio(q)
        yt_results = audio.search_youtube_audio(q)
        combined = []
        max_len = max(len(saavn_results), len(yt_results))
        for i in range(max_len):
            if i < len(saavn_results): combined.append(saavn_results[i])
            if i < len(yt_results): combined.append(yt_results[i])
        return combined if combined else audio.search_itunes(q)

@app.get("/api/audio/stream/{video_id}")
def get_audio_stream(video_id: str):
    url = audio.resolve_youtube_stream_url(video_id)
    return {"url": url}

@app.post("/api/library/add")
def add_to_library(item: dict, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        # Ensure we don't overwrite file_path if it was set by local scan
        c.execute("INSERT OR IGNORE INTO library (user_id, tmdb_id, type, title) VALUES (?, ?, ?, ?)", 
                  (user_id, item.get('tmdb_id'), item.get('type'), item.get('title')))
    return {"status": "ok"}

@app.get("/api/favorites")
def get_favorites(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT tmdb_id, type, title FROM favorites WHERE user_id=?", (user_id,))
        rows = c.fetchall()
    
    # Adapt rows for enrich_media_list
    adapted_rows = [(r[0], r[1], r[2], None) for r in rows]
    return enrich_media_list(adapted_rows)

@app.post("/api/favorites/toggle")
def toggle_favorite(item: dict, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT 1 FROM favorites WHERE user_id=? AND tmdb_id=?", (user_id, item.get('tmdb_id')))
        exists = c.fetchone()
        
        if exists:
            c.execute("DELETE FROM favorites WHERE user_id=? AND tmdb_id=?", (user_id, item.get('tmdb_id')))
            status = "removed"
        else:
            c.execute("INSERT INTO favorites (user_id, tmdb_id, type, title) VALUES (?, ?, ?, ?)", 
                      (user_id, item.get('tmdb_id'), item.get('type'), item.get('title')))
            status = "added"
    return {"status": status}

@app.get("/api/favorites/check/{tmdb_id}")
def check_favorite(tmdb_id: int, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT 1 FROM favorites WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
        exists = c.fetchone()
    return {"is_favorite": bool(exists)}

@app.post("/api/progress")
def save_progress(p: Progress, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        if p.type and p.title:
            c.execute("INSERT OR IGNORE INTO library (user_id, tmdb_id, type, title) VALUES (?, ?, ?, ?)", 
                      (user_id, p.tmdb_id, p.type, p.title))

        c.execute("INSERT OR REPLACE INTO progress (user_id, tmdb_id, time, watched, last_updated) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)", 
                  (user_id, p.tmdb_id, p.time, 1 if p.watched else 0))
    return {"status": "ok"}

@app.get("/api/continue-watching")
def get_continue_watching(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        query = """
        SELECT p.tmdb_id, l.type, l.title, p.time, l.file_path
        FROM progress p 
        LEFT JOIN library l ON p.tmdb_id = l.tmdb_id AND (l.user_id = p.user_id OR l.user_id = 'local')
        WHERE p.user_id = ? AND p.watched = 0 
        ORDER BY p.last_updated DESC 
        LIMIT 20
        """
        c.execute(query, (user_id,))
        rows = c.fetchall()
        
    results = []
    for r in rows:
        tmdb_id, mtype, title, progress_val, file_path = r
        mtype = mtype or "movie"
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
                "progress": progress_val,
                "is_local": file_path is not None
            })
    return results

@app.get("/api/progress/{tmdb_id}")
def get_progress(tmdb_id: int, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT time, watched FROM progress WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
        row = c.fetchone()
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
            
            mtype = item.get('media_type') or ("movie" if "title" in item else "tv")
            poster = f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None
            backdrop = f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None
            
            processed.append({
                "tmdb_id": item.get('id'),
                "type": mtype,
                "title": item.get('title') or item.get('name'),
                "poster": poster,
                "backdrop": backdrop,
                "overview": item.get('overview')
            })
    return processed

# --- Ratings ---
class RatingInput(BaseModel):
    tmdb_id: int
    type: str
    rating: float  # 1-10

@app.post("/api/ratings")
def rate_item(r: RatingInput, user_id: str = Depends(get_current_user)):
    if not 1 <= r.rating <= 10:
        raise HTTPException(400, "Rating must be between 1 and 10")
    with get_db() as conn:
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO ratings (user_id, tmdb_id, type, rating) VALUES (?,?,?,?)",
                  (user_id, r.tmdb_id, r.type, r.rating))
    return {"status": "ok", "rating": r.rating}

@app.get("/api/ratings/{tmdb_id}")
def get_rating(tmdb_id: int, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT rating FROM ratings WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
        row = c.fetchone()
    return {"rating": row[0] if row else None}

# --- Watchlist ---
@app.get("/api/watchlist")
def get_watchlist(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT tmdb_id, type, title FROM watchlist WHERE user_id=? ORDER BY added_at DESC", (user_id,))
        rows = c.fetchall()
    return enrich_media_list([(r[0], r[1], r[2], None) for r in rows])

@app.post("/api/watchlist/toggle")
def toggle_watchlist(item: dict, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT 1 FROM watchlist WHERE user_id=? AND tmdb_id=?", (user_id, item.get('tmdb_id')))
        if c.fetchone():
            c.execute("DELETE FROM watchlist WHERE user_id=? AND tmdb_id=?", (user_id, item.get('tmdb_id')))
            return {"status": "removed", "in_watchlist": False}
        else:
            c.execute("INSERT INTO watchlist (user_id, tmdb_id, type, title) VALUES (?,?,?,?)",
                      (user_id, item.get('tmdb_id'), item.get('type'), item.get('title')))
            return {"status": "added", "in_watchlist": True}

@app.get("/api/watchlist/check/{tmdb_id}")
def check_watchlist(tmdb_id: int, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT 1 FROM watchlist WHERE user_id=? AND tmdb_id=?", (user_id, tmdb_id))
        exists = c.fetchone()
    return {"in_watchlist": bool(exists)}

# --- Watch History ---
@app.post("/api/history/log")
def log_watch(item: dict, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("INSERT INTO watch_history (user_id, tmdb_id, type, title, duration) VALUES (?,?,?,?,?)",
                  (user_id, item.get('tmdb_id'), item.get('type'), item.get('title'), item.get('duration', 0)))
    return {"status": "logged"}

@app.get("/api/history")
def get_history(user_id: str = Depends(get_current_user), limit: int = 50):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT DISTINCT tmdb_id, type, title FROM watch_history WHERE user_id=? ORDER BY watched_at DESC LIMIT ?", (user_id, limit))
        rows = c.fetchall()
    return enrich_media_list([(r[0], r[1], r[2], None) for r in rows])

@app.delete("/api/history")
def clear_history(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("DELETE FROM watch_history WHERE user_id=?", (user_id,))
    return {"status": "cleared"}

# --- User Preferences ---
@app.get("/api/preferences")
def get_preferences(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT language, subtitle_lang, autoplay_next, maturity_level, default_source, theme FROM user_preferences WHERE user_id=?", (user_id,))
        row = c.fetchone()
    if row:
        return {"language": row[0], "subtitle_lang": row[1], "autoplay_next": bool(row[2]),
                "maturity_level": row[3], "default_source": row[4], "theme": row[5]}
    return {"language": "en", "subtitle_lang": "off", "autoplay_next": True,
            "maturity_level": "all", "default_source": "2embed", "theme": "dark"}

@app.put("/api/preferences")
def update_preferences(prefs: dict, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("""INSERT OR REPLACE INTO user_preferences 
                     (user_id, language, subtitle_lang, autoplay_next, maturity_level, default_source, theme, updated_at) 
                     VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)""",
                  (user_id, prefs.get('language','en'), prefs.get('subtitle_lang','off'),
                   1 if prefs.get('autoplay_next', True) else 0,
                   prefs.get('maturity_level','all'), prefs.get('default_source','2embed'),
                   prefs.get('theme','dark')))
    return {"status": "updated"}

# --- Search History ---
@app.post("/api/search-history")
def save_search(body: dict, user_id: str = Depends(get_current_user)):
    q = body.get('query', '').strip()
    if not q: return {"status": "empty"}
    with get_db() as conn:
        c = conn.cursor()
        c.execute("INSERT INTO search_history (user_id, query) VALUES (?,?)", (user_id, q))
    return {"status": "saved"}

@app.get("/api/search-history")
def get_search_history(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT DISTINCT query FROM search_history WHERE user_id=? ORDER BY searched_at DESC LIMIT 10", (user_id,))
        rows = c.fetchall()
    return [r[0] for r in rows]

# --- Notifications ---
@app.get("/api/notifications")
def get_notifications(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20", (user_id,))
        rows = c.fetchall()
    return [{"id": r[0], "title": r[1], "message": r[2], "type": r[3], "is_read": bool(r[4]), "created_at": r[5]} for r in rows]

@app.put("/api/notifications/read-all")
def mark_all_read(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("UPDATE notifications SET is_read=1 WHERE user_id=?", (user_id,))
    return {"status": "ok"}

# --- User Stats ---
@app.get("/api/stats")
def get_user_stats(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM favorites WHERE user_id=?", (user_id,))
        fav_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM watchlist WHERE user_id=?", (user_id,))
        wl_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM watch_history WHERE user_id=?", (user_id,))
        hist_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM ratings WHERE user_id=?", (user_id,))
        rate_count = c.fetchone()[0]
        c.execute("SELECT SUM(duration) FROM watch_history WHERE user_id=?", (user_id,))
        total_time = c.fetchone()[0] or 0
    return {"favorites": fav_count, "watchlist": wl_count, "history": hist_count,
            "ratings": rate_count, "total_watch_time_minutes": round(total_time / 60, 1)}

# --- Full Details (for MovieDetailPage) ---
@app.get("/api/details/{media_type}/{tmdb_id}")
def get_full_details(media_type: str, tmdb_id: int):
    if media_type not in ["movie", "tv"]:
        raise HTTPException(400, "media_type must be 'movie' or 'tv'")

    meta = tmdb.get_details(tmdb_id, media_type)
    if not meta:
        raise HTTPException(404, "Not found")

    credits = tmdb.get_credits(tmdb_id, media_type)
    cast = [
        {
            "id": m.get("id"),
            "name": m.get("name"),
            "character": m.get("character"),
            "profile_path": f"https://image.tmdb.org/t/p/w185{m['profile_path']}" if m.get("profile_path") else None,
        }
        for m in (credits.get("cast") or [])[:8]
    ]

    genres = [{"id": g["id"], "name": g["name"]} for g in (meta.get("genres") or [])]
    title = meta.get("title") or meta.get("name") or "Unknown"
    release = meta.get("release_date") or meta.get("first_air_date") or ""
    
    ep_runtime = meta.get("episode_run_time")
    runtime = meta.get("runtime") or (ep_runtime[0] if ep_runtime and len(ep_runtime) > 0 else None)


    return {
        "tmdb_id": tmdb_id,
        "type": media_type,
        "title": title,
        "tagline": meta.get("tagline", ""),
        "overview": meta.get("overview", ""),
        "vote_average": round(meta.get("vote_average", 0), 1),
        "vote_count": meta.get("vote_count", 0),
        "runtime": runtime,
        "release_date": release,
        "release_year": release[:4] if release else "",
        "genres": genres,
        "poster": f"https://image.tmdb.org/t/p/w500{meta['poster_path']}" if meta.get("poster_path") else None,
        "backdrop": f"https://image.tmdb.org/t/p/original{meta['backdrop_path']}" if meta.get("backdrop_path") else None,
        "cast": cast,
        "status": meta.get("status", ""),
        "number_of_seasons": meta.get("number_of_seasons"),
        "number_of_episodes": meta.get("number_of_episodes"),
    }


@app.get("/api/videos/{media_type}/{tmdb_id}")
def get_videos(media_type: str, tmdb_id: int):
    if media_type not in ["movie", "tv"]:
        raise HTTPException(400, "media_type must be 'movie' or 'tv'")

    data = tmdb.get_videos(tmdb_id, media_type)
    videos = data.get("results", [])

    # Prefer official trailers on YouTube
    trailers = [v for v in videos if v.get("site") == "YouTube" and v.get("type") == "Trailer"]
    teasers = [v for v in videos if v.get("site") == "YouTube" and v.get("type") == "Teaser"]
    clips = [v for v in videos if v.get("site") == "YouTube"]

    best = (trailers or teasers or clips or [None])[0]
    return {
        "trailer_key": best.get("key") if best else None,
        "trailer_name": best.get("name") if best else None,
        "all_videos": [
            {"key": v.get("key"), "name": v.get("name"), "type": v.get("type")}
            for v in clips[:5]
        ]
    }


# --- Heartbeat (playback resume tracking) ---
class HeartbeatInput(BaseModel):
    tmdb_id: int
    position_seconds: float
    type: Optional[str] = "movie"
    title: Optional[str] = None


@app.post("/api/heartbeat")
def playback_heartbeat(hb: HeartbeatInput, user_id: str = Depends(get_current_user)):
    """Called periodically while the trailer/player is running. Stores playback position."""
    with get_db() as conn:
        c = conn.cursor()
        # Ensure item is in library
        if hb.type and hb.title:
            c.execute(
                "INSERT OR IGNORE INTO library (user_id, tmdb_id, type, title) VALUES (?, ?, ?, ?)",
                (user_id, hb.tmdb_id, hb.type, hb.title)
            )
        c.execute(
            "INSERT OR REPLACE INTO progress (user_id, tmdb_id, time, watched, last_updated) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)",
            (user_id, hb.tmdb_id, hb.position_seconds)
        )
    return {"status": "ok", "position": hb.position_seconds}


# --- Similar / Recommendations ---
@app.get("/api/similar/{tmdb_id}")
def get_similar(tmdb_id: int, media_type: str = "movie"):
    query = f"similar_{media_type}_{tmdb_id}"
    cached = tmdb.get_from_cache(query)
    if cached: return process_tmdb_results(cached)
    if not tmdb.API_KEY or tmdb.API_KEY == "YOUR_TMDB_API_KEY": return []
    try:
        import requests as req
        url = f"{tmdb.BASE_URL}/{media_type}/{tmdb_id}/similar"
        resp = req.get(url, params={"api_key": tmdb.API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        tmdb.save_to_cache(query, data)
        return process_tmdb_results(data)
    except:
        return []

# --- Local Library & Streaming ---
LIBRARY_DIR = os.path.join(os.path.dirname(__file__), "..", "library")

@app.post("/api/admin/scan-library")
def trigger_library_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(scan_local_library)
    return {"status": "scanning started"}

def scan_local_library():
    log.info("Starting local library scan...")
    if not os.path.exists(LIBRARY_DIR):
        log.warning(f"Library directory not found: {LIBRARY_DIR}")
        return

    try:
        scanned_files = []
        for filename in os.listdir(LIBRARY_DIR):
            if filename.endswith((".mp4", ".mkv", ".avi")):
                match = re.match(r"(.*?)(?:\s*\((\d{4})\))?\.\w+", filename)
                if match:
                    title = match.group(1).strip().replace(".", " ")
                    year = match.group(2)
                    
                    query = title if not year else f"{title} y:{year}"
                    results = tmdb.search_multi(query)
                    
                    tmdb_id = None
                    mtype = 'movie'
                    
                    if results and 'results' in results and len(results['results']) > 0:
                        # Prefer movies
                        movies = [res for res in results['results'] if res.get('media_type') == 'movie']
                        best_match = movies[0] if movies else results['results'][0]
                        tmdb_id = best_match.get('id')
                        mtype = best_match.get('media_type', 'movie')
                        
                    if tmdb_id:
                        file_path = os.path.join(LIBRARY_DIR, filename)
                        scanned_files.append((tmdb_id, mtype, title, file_path))
                        
        if scanned_files:
            with get_db() as conn:
                c = conn.cursor()
                for tmdb_id, mtype, title, file_path in scanned_files:
                    c.execute("""
                        INSERT OR REPLACE INTO library (user_id, tmdb_id, type, title, file_path) 
                        VALUES ('local', ?, ?, ?, ?)
                    """, (tmdb_id, mtype, title, file_path))
        log.info(f"Local library scan complete. Processed {len(scanned_files)} files.")
    except Exception as e:
        log.error(f"Error during library scan: {e}")

def send_bytes_range_requests(file_obj, start: int, end: int, chunk_size: int = 1024 * 1024):
    """Send a file in chunks using Range Requests method."""
    with file_obj as f:
        f.seek(start)
        while (pos := f.tell()) <= end:
            read_size = min(chunk_size, end + 1 - pos)
            yield f.read(read_size)

@app.get("/api/stream/{tmdb_id}")
def stream_video(tmdb_id: int, request: Request, user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        # Look for local file in library where user is 'local' or the current user
        c.execute("SELECT file_path FROM library WHERE tmdb_id=? AND (user_id='local' OR user_id=?) AND file_path IS NOT NULL LIMIT 1", (tmdb_id, user_id))
        row = c.fetchone()
    
    if not row or not row[0] or not os.path.exists(row[0]):
        raise HTTPException(status_code=404, detail="Local video file not found")
        
    file_path = row[0]
    file_size = os.stat(file_path).st_size
    range_header = request.headers.get('Range')
    
    if range_header:
        # e.g., bytes=0-1024
        byte1, byte2 = 0, None
        match = re.search(r'bytes=(\d+)-(\d*)', range_header)
        if match:
            byte1 = int(match.group(1))
            if match.group(2):
                byte2 = int(match.group(2))
        
        start = byte1
        end = byte2 if byte2 is not None else file_size - 1
        length = end - start + 1
        
        headers = {
            'Content-Range': f'bytes {start}-{end}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(length),
            'Content-Type': 'video/mp4',
        }
        
        return StreamingResponse(
            send_bytes_range_requests(open(file_path, mode="rb"), start, end),
            status_code=206,
            headers=headers
        )
    else:
        return FileResponse(file_path, media_type="video/mp4", headers={'Accept-Ranges': 'bytes'})


@app.get("/api/recommendations")
def get_recommendations(user_id: str = Depends(get_current_user)):
    # Very smart logic: Look at their recent watch history, favorites, and watchlist.
    with get_db() as conn:
        c = conn.cursor()
        # Get 3 most recently watched, 1 favorite, 1 watchlist
        c.execute("SELECT tmdb_id, type FROM watch_history WHERE user_id=? ORDER BY watched_at DESC LIMIT 3", (user_id,))
        history = c.fetchall()
        c.execute("SELECT tmdb_id, type FROM favorites WHERE user_id=? ORDER BY rowid DESC LIMIT 2", (user_id,))
        favs = c.fetchall()
        c.execute("SELECT tmdb_id, type FROM watchlist WHERE user_id=? ORDER BY rowid DESC LIMIT 2", (user_id,))
        watchlist = c.fetchall()

    pool = history + favs + watchlist
    if not pool:
        # Fallback to trending
        return tmdb.get_trending("all", "week").get("results", [])

    import random
    selected = random.choice(pool)
    similar = tmdb.get_similar(selected[0], selected[1])
    # Filter out things they already watched or have in library
    return similar[:12]

@app.get("/api/stats")
def get_user_stats(user_id: str = Depends(get_current_user)):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT SUM(duration) FROM watch_history WHERE user_id=?", (user_id,))
        row = c.fetchone()
        total_watch_time = row[0] if row and row[0] else 0

        c.execute("SELECT COUNT(*) FROM watch_history WHERE user_id=?", (user_id,))
        total_sessions = c.fetchone()[0]

        # In a real scenario we'd join with a genre table, but since we store titles,
        # let's fetch their history and analyze genres dynamically via TMDB cache if possible.
        # For performance, we'll return aggregate numbers here.
        c.execute("SELECT type, COUNT(*) as cnt FROM watch_history WHERE user_id=? GROUP BY type", (user_id,))
        type_breakdown = c.fetchall()

        c.execute("SELECT tmdb_id, type FROM favorites WHERE user_id=?", (user_id,))
        fav_count = len(c.fetchall())

    return {
        "total_watch_time_minutes": total_watch_time,
        "total_sessions": total_sessions,
        "type_breakdown": {t: cnt for t, cnt in type_breakdown},
        "total_favorites": fav_count,
        "user_id": user_id
    }

# --- Static Files & SPA Routing ---
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404)
        
    full_file_path = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(full_file_path):
        return FileResponse(full_file_path)
        
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="SPA Index not found")

if __name__ == "__main__":
    import uvicorn
    # Trigger an initial background scan or just let the admin do it.
    uvicorn.run(app, host="0.0.0.0", port=8000)
