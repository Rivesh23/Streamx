import requests
import sqlite3
import json
import os
import time
from dotenv import load_dotenv
from logger import log

load_dotenv()

API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"
CACHE_DIR = os.getenv("DATA_DIR", os.path.dirname(__file__))
CACHE_DB = os.path.join(CACHE_DIR, "metadata_cache.db")

# 24 hours TTL
CACHE_TTL = 24 * 60 * 60 

if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
    log.warning("TMDB_API_KEY is missing or invalid! Using limited mock dataset. Search results will be severely limited.")

MOCK_DETAILS = {
    27205: {"poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", "overview": "Inception..."},
    603: {"poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "backdrop_path": "/7u3pxc0z1wxV4FFr3i5eD8w10fr.jpg", "overview": "The Matrix..."},
    1396: {"poster_path": "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", "backdrop_path": "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg", "overview": "Breaking Bad...", "seasons": 5},
    66732: {"poster_path": "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", "backdrop_path": "/56v2KjBlU4XaOv9rVYkJu64COcfe.jpg", "overview": "Stranger Things...", "seasons": 4},
}

def init_cache():
    try:
        conn = sqlite3.connect(CACHE_DB)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS cache (query TEXT PRIMARY KEY, response TEXT, timestamp REAL)''')
        # Check if timestamp exists
        c.execute(f"PRAGMA table_info(cache)")
        cols = [col[1] for col in c.fetchall()]
        if 'timestamp' not in cols:
            log.info("Migrating cache db to include timestamp...")
            c.execute("ALTER TABLE cache ADD COLUMN timestamp REAL")
        conn.commit()
        conn.close()
    except Exception as e:
        log.critical(f"Failed to initialize TMDB cache: {e}")

def get_from_cache(query):
    try:
        conn = sqlite3.connect(CACHE_DB)
        c = conn.cursor()
        c.execute("SELECT response, timestamp FROM cache WHERE query=?", (query,))
        row = c.fetchone()
        conn.close()
        
        if row:
            response, timestamp = row
            # If timestamp is missing or cache is expired
            if timestamp is None or (time.time() - timestamp) > CACHE_TTL:
                return None
            return json.loads(response)
    except Exception as e:
        log.error(f"Error reading from TMDB cache: {e}")
    return None

def save_to_cache(query, response):
    try:
        conn = sqlite3.connect(CACHE_DB)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO cache (query, response, timestamp) VALUES (?, ?, ?)", 
                  (query, json.dumps(response), time.time()))
        conn.commit()
        conn.close()
    except Exception as e:
        log.error(f"Error saving to TMDB cache: {e}")

def check_health():
    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
        return False
    try:
        resp = requests.get(f"{BASE_URL}/configuration", params={"api_key": API_KEY}, timeout=5)
        return resp.status_code == 200
    except requests.exceptions.RequestException:
        return False

def search_multi(query_str):
    query = f"search_multi_{query_str}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
        q_lower = query_str.lower()
        mock_results = []
        if "avenger" in q_lower or "endgame" in q_lower:
            mock_results.append({"id": 299534, "media_type": "movie", "title": "Avengers: Endgame", "poster_path": "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", "backdrop_path": "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", "overview": "After the devastating events..."})
        if "matrix" in q_lower:
            mock_results.append({"id": 603, "media_type": "movie", "title": "The Matrix", "poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "backdrop_path": "/7u3pxc0z1wxV4FFr3i5eD8w10fr.jpg", "overview": "Set in the 22nd century..."})
        if "inception" in q_lower or "nolan" in q_lower:
            mock_results.append({"id": 27205, "media_type": "movie", "title": "Inception", "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", "overview": "Cobb, a skilled thief..."})
        if "dark knight" in q_lower or "batman" in q_lower:
            mock_results.append({"id": 155, "media_type": "movie", "title": "The Dark Knight", "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "backdrop_path": "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", "overview": "Batman raises the stakes..."})
        if "stranger" in q_lower or "things" in q_lower:
            mock_results.append({"id": 66732, "media_type": "tv", "name": "Stranger Things", "poster_path": "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", "backdrop_path": "/56v2KjBlU4XaOv9rVYkJu64COcfe.jpg", "overview": "When a young boy vanishes..."})
        if "breaking" in q_lower or "bad" in q_lower:
            mock_results.append({"id": 1396, "media_type": "tv", "name": "Breaking Bad", "poster_path": "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", "backdrop_path": "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg", "overview": "When Walter White..."})
        return {"results": mock_results}

    try:
        url = f"{BASE_URL}/search/multi"
        params = {"api_key": API_KEY, "query": query_str, "include_adult": "false"}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB search failed for query '{query_str}': {e}")
        return {"results": []}

def get_details(tmdb_id, media_type):
    if int(tmdb_id) in MOCK_DETAILS:
        return MOCK_DETAILS[int(tmdb_id)]

    query = f"details_{media_type}_{tmdb_id}"
    cached = get_from_cache(query)
    if cached: return cached

    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
        return {} 

    try:
        url = f"{BASE_URL}/{media_type}/{tmdb_id}"
        resp = requests.get(url, params={"api_key": API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_details failed for {media_type} {tmdb_id}: {e}")
        return {}

def get_tv_seasons(tmdb_id):
    if int(tmdb_id) in MOCK_DETAILS:
        count = MOCK_DETAILS[int(tmdb_id)].get("seasons", 1)
        return {"seasons": [{"season_number": i, "episode_count": 10} for i in range(1, count + 1)]}

    data = get_details(tmdb_id, "tv")
    return data

def get_trending(media_type="all", time_window="day"):
    query = f"trending_{media_type}_{time_window}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY": return {"results": []}
    
    try:
        url = f"{BASE_URL}/trending/{media_type}/{time_window}"
        resp = requests.get(url, params={"api_key": API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_trending failed: {e}")
        return {"results": []}

def get_discover(media_type="movie", sort_by="popularity.desc", genre_id=None):
    query = f"discover_{media_type}_{sort_by}_{genre_id}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY": return {"results": []}
    
    try:
        url = f"{BASE_URL}/discover/{media_type}"
        params = {
            "api_key": API_KEY, 
            "sort_by": sort_by, 
            "include_adult": "false"
        }
        if genre_id:
            params["with_genres"] = genre_id
            
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_discover failed: {e}")
        return {"results": []}

def get_credits(tmdb_id, media_type):
    """Fetch cast & crew for a movie or TV show. Returns top cast members."""
    query = f"credits_{media_type}_{tmdb_id}"
    cached = get_from_cache(query)
    if cached: return cached

    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
        return {"cast": []}

    try:
        url = f"{BASE_URL}/{media_type}/{tmdb_id}/credits"
        resp = requests.get(url, params={"api_key": API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_credits failed for {media_type} {tmdb_id}: {e}")
        return {"cast": []}


def get_videos(tmdb_id, media_type):
    """Fetch trailers/videos. Returns the list of video objects from TMDB."""
    query = f"videos_{media_type}_{tmdb_id}"
    cached = get_from_cache(query)
    if cached: return cached

    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY":
        return {"results": []}

    try:
        url = f"{BASE_URL}/{media_type}/{tmdb_id}/videos"
        resp = requests.get(url, params={"api_key": API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_videos failed for {media_type} {tmdb_id}: {e}")
        return {"results": []}


def get_genres(media_type="movie"):
    query = f"genres_{media_type}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if not API_KEY or API_KEY == "YOUR_TMDB_API_KEY": return {"genres": []}
    
    try:
        url = f"{BASE_URL}/genre/{media_type}/list"
        resp = requests.get(url, params={"api_key": API_KEY}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        save_to_cache(query, data)
        return data
    except requests.exceptions.RequestException as e:
        log.error(f"TMDB get_genres failed: {e}")
        return {"genres": []}