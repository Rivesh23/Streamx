import requests
import json
import logging
from typing import List, Dict, Any

log = logging.getLogger("streamx.audio")

YOUTUBE_INSTANCES = [
    "https://inv.tux.pizza/api/v1",
    "https://vid.puffyan.us/api/v1",
    "https://invidious.nerdvpn.de/api/v1",
    "https://pipedapi.kavin.rocks",
    "https://api.piped.video",
]

SAAVN_INSTANCES = [
    "https://saavn.dev/api",
    "https://saavn.echomusic.fun/api",
]

def search_youtube_audio(query: str) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        return []

    query_str = query.strip()

    # Try Invidious & Piped endpoints server-side
    for base_url in YOUTUBE_INSTANCES:
        try:
            if "piped" in base_url:
                resp = requests.get(f"{base_url}/search", params={"q": query_str, "filter": "music_songs"}, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("items", [])
                    results = []
                    for item in items:
                        if item.get("type") == "stream" or "/watch?v=" in item.get("url", ""):
                            vid_id = item.get("url", "").replace("/watch?v=", "") if "url" in item else item.get("id")
                            if vid_id:
                                results.append({
                                    "id": f"yt_{vid_id}",
                                    "youtubeId": vid_id,
                                    "title": item.get("title", "Unknown Title"),
                                    "artist": item.get("uploaderName", "YouTube Artist"),
                                    "album": "YouTube Audio",
                                    "artworkUrl": item.get("thumbnail") or f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg",
                                    "previewUrl": None,
                                    "downloadUrl": None,
                                    "durationMs": (item.get("duration", 0) or 0) * 1000,
                                    "genre": "YouTube Music",
                                    "isYouTube": True
                                })
                    if results:
                        return results
            else:
                resp = requests.get(f"{base_url}/search", params={"q": query_str, "type": "video"}, timeout=5)
                if resp.status_code == 200:
                    items = resp.json()
                    if isinstance(items, list):
                        results = []
                        for item in items:
                            vid_id = item.get("videoId")
                            if vid_id:
                                thumbs = item.get("videoThumbnails") or []
                                thumb_url = thumbs[0].get("url") if thumbs else f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
                                results.append({
                                    "id": f"yt_{vid_id}",
                                    "youtubeId": vid_id,
                                    "title": item.get("title", "Unknown Title"),
                                    "artist": item.get("author", "YouTube Artist"),
                                    "album": "YouTube Audio",
                                    "artworkUrl": thumb_url,
                                    "previewUrl": None,
                                    "downloadUrl": None,
                                    "durationMs": (item.get("lengthSeconds", 0) or 0) * 1000,
                                    "genre": "YouTube Music",
                                    "isYouTube": True
                                })
                        if results:
                            return results
        except Exception as e:
            log.warning(f"YouTube search error on {base_url}: {e}")
            continue

    # Fallback to iTunes API if YouTube instances fail
    return search_itunes(query_str)


def search_saavn_audio(query: str) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        return []

    for base_url in SAAVN_INSTANCES:
        try:
            resp = requests.get(f"{base_url}/search/songs", params={"query": query.strip(), "limit": 30}, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                raw_results = data.get("data", {}).get("results", []) or data.get("results", [])
                results = []
                for song in raw_results:
                    # Best quality artwork
                    imgs = song.get("image") or []
                    artwork = ""
                    if isinstance(imgs, list) and len(imgs) > 0:
                        artwork = imgs[-1].get("link") or imgs[-1].get("url") or ""

                    # Stream URL
                    urls = song.get("downloadUrl") or []
                    stream_url = None
                    if isinstance(urls, list) and len(urls) > 0:
                        q320 = next((u for u in urls if u.get("quality") == "320kbps"), None)
                        stream_url = (q320.get("link") or q320.get("url")) if q320 else (urls[-1].get("link") or urls[-1].get("url"))

                    artists = song.get("artists", {})
                    primary = artists.get("primary", []) if isinstance(artists, dict) else []
                    artist_name = ", ".join([a.get("name") for a in primary]) if primary else "Unknown Artist"
                    artist_id = str(primary[0].get("id")) if primary else None

                    album_obj = song.get("album") or {}
                    album_name = album_obj.get("name") if isinstance(album_obj, dict) else str(album_obj)
                    album_id = str(album_obj.get("id")) if isinstance(album_obj, dict) and album_obj.get("id") else None

                    results.append({
                        "id": str(song.get("id")),
                        "title": song.get("name") or song.get("title") or "Unknown Track",
                        "artist": artist_name,
                        "artistId": artist_id,
                        "album": album_name,
                        "albumId": album_id,
                        "artworkUrl": artwork,
                        "previewUrl": stream_url,
                        "downloadUrl": stream_url,
                        "durationMs": (song.get("duration", 0) or 0) * 1000,
                        "genre": song.get("language") or "Lossless 320kbps",
                        "isYouTube": False
                    })
                if results:
                    return results
        except Exception as e:
            log.warning(f"JioSaavn search error on {base_url}: {e}")
            continue

    return search_itunes(query.strip())


def search_itunes(query: str) -> List[Dict[str, Any]]:
    try:
        url = f"https://itunes.apple.com/search?term={requests.utils.quote(query)}&media=music&entity=song&limit=30"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for r in data.get("results", []):
                results.append({
                    "id": str(r.get("trackId")),
                    "title": r.get("trackName", "Unknown Track"),
                    "artist": r.get("artistName", "Unknown Artist"),
                    "album": r.get("collectionName", ""),
                    "artworkUrl": (r.get("artworkUrl100") or "").replace("100x100bb", "400x400bb"),
                    "previewUrl": r.get("previewUrl"),
                    "downloadUrl": r.get("previewUrl"),
                    "durationMs": r.get("trackTimeMillis", 0),
                    "genre": r.get("primaryGenreName", "Music"),
                    "isYouTube": False
                })
            return results
    except Exception as e:
        log.error(f"iTunes fallback error: {e}")
    return []


def resolve_youtube_stream_url(video_id: str) -> str:
    for base_url in YOUTUBE_INSTANCES:
        try:
            if "piped" in base_url:
                resp = requests.get(f"{base_url}/streams/{video_id}", timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    audio_streams = data.get("audioStreams", [])
                    if audio_streams:
                        audio_streams.sort(key=lambda x: x.get("bitrate", 0), reverse=True)
                        return audio_streams[0].get("url")
            else:
                resp = requests.get(f"{base_url}/videos/{video_id}", timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    adaptive = data.get("adaptiveFormats", [])
                    audio_formats = [f for f in adaptive if f.get("type", "").startswith("audio/")]
                    if audio_formats:
                        audio_formats.sort(key=lambda x: x.get("bitrate", 0), reverse=True)
                        return audio_formats[0].get("url")
        except Exception:
            continue
    return f"https://pipedapi.kavin.rocks/proxy?url=https://www.youtube.com/watch?v={video_id}"
