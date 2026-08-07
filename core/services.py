# core/services.py
import os
import sys
import json
import re
import hashlib
import urllib.request
from pathlib import Path
import yt_dlp
from PIL import Image

def fetch_video_metadata(url: str, cookies_file: str, browser_cookies: str, scratch_dir: Path, app_data_dir: Path) -> dict:
    """
    Extracts full metadata from a video URL using yt-dlp, and downloads/compresses its thumbnail.
    This contains pure business logic and has no dependency on Tkinter or other UI modules.
    """

    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'legacyserverconnect': True,
        'extractor_args': {'youtube': {'player_client': ['ios', 'android_vr', 'web']}},
    }

    if 'list=' in url:
        ydl_opts['extract_flat'] = 'in_playlist'

    if not cookies_file:
        synced_cookies = app_data_dir / "user_cookies.txt"
        if synced_cookies.exists() and synced_cookies.stat().st_size > 0:
            cookies_file = str(synced_cookies)

    if cookies_file:
        ydl_opts['cookiefile'] = cookies_file
    elif browser_cookies and browser_cookies not in ("kapali", "disabled", "off", "closed", "none", "auto"):
        ydl_opts['cookiesfrombrowser'] = (browser_cookies,)

    info = None
    # Stage 1: Try direct extraction on user's exact URL
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        print(f"[Services] Direct URL metadata extraction warning: {e}")

    # Stage 1b: If auto mode enabled and direct extraction failed, try browser fallback loop
    if not info and browser_cookies == "auto":
        for b in ["edge", "firefox", "brave", "opera", "vivaldi", "chrome"]:
            try:
                auto_opts = dict(ydl_opts)
                auto_opts['cookiesfrombrowser'] = (b,)
                with yt_dlp.YoutubeDL(auto_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                if info:
                    print(f"[Services] Auto metadata fetch succeeded using browser '{b}'")
                    break
            except Exception as e:
                print(f"[Services] Auto browser '{b}' metadata extraction warning: {e}")

    # Stage 2: If direct extraction produced no entries and a playlist ID exists, try normalized playlist URL
    playlist_match = re.search(r'[?&]list=([a-zA-Z0-9_-]+)', url)
    if (not info or not info.get("entries")) and playlist_match:
        playlist_id = playlist_match.group(1)
        target_url = f"https://www.youtube.com/playlist?list={playlist_id}"
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(target_url, download=False)
        except Exception as e:
            print(f"[Services] Normalized playlist URL extraction warning: {e}")

    if not info:
        raise ValueError("Oynatma listesi veya video bilgileri çekilemedi. Lütfen URL'yi kontrol edin.")

    title = info.get("title", "Unknown Title")
    uploader = info.get("uploader", info.get("channel", "Unknown Channel"))
    duration_sec = info.get("duration", 0.0)

    thumbnail_url = info.get("thumbnail")
    compressed_thumb_path = None

    if thumbnail_url:
        try:
            url_hash = hashlib.md5(thumbnail_url.encode()).hexdigest()
            thumbs_dir = app_data_dir / "thumbnails"
            thumbs_dir.mkdir(parents=True, exist_ok=True)
            compressed_thumb_path = thumbs_dir / f"thumb_{url_hash}.webp"
            
            temp_raw_path = scratch_dir / f"temp_{url_hash}.jpg"
            
            req = urllib.request.Request(thumbnail_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                with open(temp_raw_path, 'wb') as out_file:
                    out_file.write(response.read())

            with Image.open(temp_raw_path) as pil_img:
                resized_webp = pil_img.resize((320, 180), Image.Resampling.LANCZOS)
                resized_webp.save(compressed_thumb_path, "webp", quality=75)
            
            try:
                os.remove(temp_raw_path)
            except Exception:
                pass
        except Exception as e:
            print(f"[Services] Thumbnail download/transcode failed: {e}")
            compressed_thumb_path = None

    ch_id = info.get("channel_id") or info.get("uploader_id")
    ch_name = info.get("channel") or info.get("uploader")
    if ch_id:
        info["channel_id"] = ch_id
    if ch_name:
        info["channel_name"] = ch_name

    playlist_entries = []
    if info.get("entries") is not None:
        try:
            raw_entries = list(info["entries"])
        except Exception:
            raw_entries = []
            
        for entry in raw_entries:
            if not entry or not isinstance(entry, dict):
                continue
            v_id = entry.get("id")
            v_title = entry.get("title") or (f"Video {v_id}" if v_id else "Untitled Video")
            v_dur = float(entry.get("duration") or 0.0)
            v_uploader = entry.get("uploader") or entry.get("channel") or uploader
            v_url = f"https://www.youtube.com/watch?v={v_id}" if v_id else entry.get("url", url)
            v_thumb = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg" if v_id else None
            playlist_entries.append({
                "id": v_id or "",
                "title": v_title,
                "url": v_url,
                "duration": v_dur,
                "uploader": v_uploader,
                "thumbnail": v_thumb
            })

    # Clean non-serializable generator from raw_info before returning
    info.pop("entries", None)

    return {
        "url": url,
        "title": title,
        "uploader": uploader,
        "duration": duration_sec,
        "thumbnail_path": str(compressed_thumb_path) if compressed_thumb_path else None,
        "chapters": info.get("chapters", []),
        "filesize": info.get("filesize"),
        "filesize_approx": info.get("filesize_approx"),
        "channel_id": ch_id,
        "channel_name": ch_name,
        "playlist_entries": playlist_entries,
        "raw_info": info
    }

def fetch_sponsor_segments(video_id: str) -> list:
    """
    Fetches SponsorBlock segments for a given YouTube video ID from the Ajay API.
    Contains pure service logic and has no dependency on Tkinter / UI elements.
    """
    url = f"https://sponsor.ajay.app/api/skipSegments?videoID={video_id}"
    segments = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                for entry in data:
                    seg = entry.get("segment")
                    cat = entry.get("category", "sponsor")
                    if seg and len(seg) == 2:
                        segments.append({
                            "start": float(seg[0]),
                            "end": float(seg[1]),
                            "category": cat
                        })
    except Exception as e:
        print(f"[SponsorBlock Service] Fetch failed or no segments found: {e}")
    return segments
