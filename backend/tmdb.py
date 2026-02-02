import requests
import sqlite3
import json
import os

from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"
CACHE_DB = os.path.join(os.path.dirname(__file__), "metadata_cache.db")

# Pre-cached data (Expanded slightly for demo)
MOCK_DETAILS = {
    # ... (Existing mock data retained for fallback) ...
    27205: {"poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", "overview": "Inception..."},
    603: {"poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "backdrop_path": "/7u3pxc0z1wxV4FFr3i5eD8w10fr.jpg", "overview": "The Matrix..."},
    1396: {"poster_path": "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", "backdrop_path": "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg", "overview": "Breaking Bad...", "seasons": 5},
    66732: {"poster_path": "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", "backdrop_path": "/56v2KjBlU4XaOv9rVYkJu64COcfe.jpg", "overview": "Stranger Things...", "seasons": 4},
}

def init_cache():
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS cache (query TEXT PRIMARY KEY, response TEXT)''')
    conn.commit()
    conn.close()

def get_from_cache(query):
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute("SELECT response FROM cache WHERE query=?", (query,))
    row = c.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def save_to_cache(query, response):
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO cache (query, response) VALUES (?, ?)", (query, json.dumps(response)))
    conn.commit()
    conn.close()

def search_multi(query_str):
    query = f"search_multi_{query_str}"
    cached = get_from_cache(query)
    if cached: return cached
    
    # Mock search results for demo mode (when no API key)
    if API_KEY == "YOUR_TMDB_API_KEY":
        q_lower = query_str.lower()
        mock_results = []
        
        # Simple keyword matching for demo
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
        if "interstellar" in q_lower:
            mock_results.append({"id": 157336, "media_type": "movie", "title": "Interstellar", "poster_path": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "backdrop_path": "/xJHokMBLzb66dDe38JzMyyuk9lz.jpg", "overview": "The adventures of explorers..."})
        
        return {"results": mock_results}

    try:
        url = f"{BASE_URL}/search/multi"
        params = {"api_key": API_KEY, "query": query_str, "include_adult": "false"}
        resp = requests.get(url, params=params).json()
        save_to_cache(query, resp)
        return resp
    except: return {"results": []}

def get_details(tmdb_id, media_type):
    # Mock fallback
    if int(tmdb_id) in MOCK_DETAILS:
        return MOCK_DETAILS[int(tmdb_id)]

    query = f"details_{media_type}_{tmdb_id}"
    cached = get_from_cache(query)
    if cached: return cached

    if API_KEY == "YOUR_TMDB_API_KEY":
        return {} 

    try:
        url = f"{BASE_URL}/{media_type}/{tmdb_id}"
        resp = requests.get(url, params={"api_key": API_KEY}).json()
        save_to_cache(query, resp)
        return resp
    except: return {}

def get_tv_seasons(tmdb_id):
    # If using mock data, return dummy structure
    if int(tmdb_id) in MOCK_DETAILS:
        count = MOCK_DETAILS[int(tmdb_id)].get("seasons", 1)
        return {"seasons": [{"season_number": i, "episode_count": 10} for i in range(1, count + 1)]}

    data = get_details(tmdb_id, "tv")
    return data # TMDB details endpoint includes 'seasons' list

def get_trending(media_type="all", time_window="day"):
    query = f"trending_{media_type}_{time_window}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if API_KEY == "YOUR_TMDB_API_KEY": return {"results": []}
    
    try:
        url = f"{BASE_URL}/trending/{media_type}/{time_window}"
        resp = requests.get(url, params={"api_key": API_KEY}).json()
        save_to_cache(query, resp)
        return resp
    except: return {"results": []}

def get_discover(media_type="movie", sort_by="popularity.desc"):
    query = f"discover_{media_type}_{sort_by}"
    cached = get_from_cache(query)
    if cached: return cached
    
    if API_KEY == "YOUR_TMDB_API_KEY": return {"results": []}
    
    try:
        url = f"{BASE_URL}/discover/{media_type}"
        resp = requests.get(url, params={"api_key": API_KEY, "sort_by": sort_by, "include_adult": "false"}).json()
        save_to_cache(query, resp)
        return resp
    except: return {"results": []}