# core/lyrics.py
"""
yt-dlp Downloader Pro - Synced Lyrics Integration Engine (LRCLIB)
Fetches synchronized and plain lyrics from LRCLIB and embeds them into audio files using Mutagen.
"""

import os
import json
import urllib.request
import urllib.parse
from pathlib import Path
import mutagen
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, USLT, ID3NoHeaderError
from mutagen.flac import FLAC
from mutagen.mp4 import MP4

LRCLIB_GET_URL = "https://lrclib.net/api/get"
LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"
USER_AGENT = "yt-dlp-Downloader-Pro/2.0 (+https://github.com/BayNuman/yt-dlp-downloader-pro)"

def fetch_lyrics_from_lrclib(track_name: str, artist_name: str = "", duration_sec: int = 0) -> dict | None:
    """Queries LRCLIB for synchronized or plain lyrics."""
    if not track_name:
        return None

    # Clean up track title (remove common trailing tags like (Official Video), [HQ], etc.)
    clean_title = track_name.split("(")[0].split("[")[0].strip()
    
    # 1. Try exact lookup
    params = {
        "track_name": clean_title
    }
    if artist_name:
        params["artist_name"] = artist_name.strip()
    if duration_sec > 0:
        params["duration"] = duration_sec

    query_str = urllib.parse.urlencode(params)
    url = f"{LRCLIB_GET_URL}?{query_str}"
    
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return {
                    "synced": data.get("syncedLyrics"),
                    "plain": data.get("plainLyrics"),
                    "track": data.get("trackName"),
                    "artist": data.get("artistName")
                }
    except Exception:
        pass

    # 2. Fallback to search query if exact match returned 404
    try:
        search_q = f"{clean_title} {artist_name}".strip()
        search_url = f"{LRCLIB_SEARCH_URL}?q={urllib.parse.quote(search_q)}"
        search_req = urllib.request.Request(search_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(search_req, timeout=5.0) as resp:
            if resp.status == 200:
                results = json.loads(resp.read().decode("utf-8"))
                if results and isinstance(results, list) and len(results) > 0:
                    best = results[0]
                    return {
                        "synced": best.get("syncedLyrics"),
                        "plain": best.get("plainLyrics"),
                        "track": best.get("trackName"),
                        "artist": best.get("artistName")
                    }
    except Exception as e:
        print(f"[Lyrics] Search lookup failed for '{clean_title}': {e}")

    return None

def embed_lyrics_into_file(file_path: str, lyrics_data: dict) -> bool:
    """Embeds lyrics into MP3, FLAC, or M4A audio files using Mutagen."""
    if not os.path.exists(file_path) or not lyrics_data:
        return False

    lyrics_text = lyrics_data.get("synced") or lyrics_data.get("plain")
    if not lyrics_text:
        return False

    ext = Path(file_path).suffix.lower()

    try:
        if ext == ".mp3":
            try:
                audio = MP3(file_path, ID3=ID3)
            except ID3NoHeaderError:
                audio = MP3(file_path)
                audio.add_tags()

            if audio.tags is None:
                audio.add_tags()

            # Add Unsynchronized/Synchronized Lyrics Frame (USLT)
            audio.tags.add(USLT(encoding=3, lang="eng", desc="Lyrics", text=lyrics_text))
            audio.save()
            print(f"[Lyrics] Successfully embedded lyrics into MP3: {file_path}")
            return True

        elif ext == ".flac":
            audio = FLAC(file_path)
            audio["LYRICS"] = lyrics_text
            audio["UNSYNCEDLYRICS"] = lyrics_text
            audio.save()
            print(f"[Lyrics] Successfully embedded lyrics into FLAC: {file_path}")
            return True

        elif ext in (".m4a", ".mp4"):
            audio = MP4(file_path)
            audio["\xa9lyr"] = [lyrics_text]
            audio.save()
            print(f"[Lyrics] Successfully embedded lyrics into M4A: {file_path}")
            return True

    except Exception as e:
        print(f"[Lyrics] Failed to embed lyrics into {file_path}: {e}")

    return False

def process_track_lyrics(file_path: str, title: str, artist: str = "", duration_sec: int = 0) -> bool:
    """High-level function called after audio download completion."""
    try:
        lyrics = fetch_lyrics_from_lrclib(title, artist, duration_sec)
        if lyrics:
            return embed_lyrics_into_file(file_path, lyrics)
    except Exception as e:
        print(f"[Lyrics] Error processing track lyrics: {e}")
    return False
