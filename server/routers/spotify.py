import re
import urllib.request
import urllib.parse
import json
import base64
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, status

from server.models import SpotifyTracksRequest
from server.security import verify_token

router = APIRouter(
    prefix="/spotify",
    tags=["spotify"],
    dependencies=[Depends(verify_token)]
)

def fetch_spotify_tracks_from_embed(playlist_id: str) -> dict:
    """Fallback parser that extracts tracks from Spotify embed page without requiring API keys."""
    url = f"https://open.spotify.com/embed/playlist/{playlist_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as res:
        html = res.read().decode('utf-8')
        
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if not match:
        raise Exception("Spotify embed parse failed: JSON script tag not found")
        
    data = json.loads(match.group(1).strip())
    entity = data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})
    playlist_title = entity.get("title") or entity.get("name") or "Spotify Playlist"
    track_list = entity.get("trackList", [])
    
    tracks = []
    for item in track_list:
        title = item.get("title", "")
        artists = item.get("subtitle", "")
        duration_ms = item.get("duration", 0)
        duration_sec = int(duration_ms / 1000) if isinstance(duration_ms, (int, float)) else 0
        
        thumb_url = ""
        cover_art = item.get("coverArt", {})
        if cover_art and cover_art.get("sources"):
            thumb_url = cover_art.get("sources")[0].get("url", "")
            
        if title:
            tracks.append({
                "name": title,
                "artists": artists if artists else "Unknown Artist",
                "duration": duration_sec,
                "thumbnail": thumb_url
            })
            
    return {"tracks": tracks, "playlist_title": playlist_title}

def fetch_spotify_tracks(playlist_id: str, client_id: str, client_secret: str) -> dict:
    if client_id and client_secret:
        try:
            # 1. Fetch access token via Spotify Web API
            auth_str = f"{client_id}:{client_secret}"
            auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            
            token_url = "https://accounts.spotify.com/api/token"
            payload = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode('utf-8')
            
            headers = {
                "Authorization": f"Basic {auth_b64}",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            token_req = urllib.request.Request(token_url, data=payload, headers=headers, method='POST')
            with urllib.request.urlopen(token_req, timeout=10) as res:
                token_data = json.loads(res.read().decode('utf-8'))
                access_token = token_data["access_token"]

            # 2. Fetch tracks and playlist name
            tracks_headers = {
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            playlist_title = "Spotify Playlist"
            try:
                pl_url = f"https://api.spotify.com/v1/playlists/{playlist_id}?fields=name"
                pl_req = urllib.request.Request(pl_url, headers=tracks_headers)
                with urllib.request.urlopen(pl_req, timeout=5) as pl_res:
                    pl_data = json.loads(pl_res.read().decode('utf-8'))
                    playlist_title = pl_data.get("name", "Spotify Playlist")
            except Exception:
                pass

            tracks = []
            next_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
            
            while next_url and len(tracks) < 300:
                req = urllib.request.Request(next_url, headers=tracks_headers)
                with urllib.request.urlopen(req, timeout=10) as res:
                    res_data = json.loads(res.read().decode('utf-8'))
                    for item in res_data.get("items", []):
                        track_info = item.get("track")
                        if not track_info:
                            continue
                        
                        name = track_info.get("name")
                        artists = [a.get("name") for a in track_info.get("artists", [])]
                        duration_ms = track_info.get("duration_ms", 0)
                        duration_sec = int(duration_ms / 1000)
                        
                        thumb_url = ""
                        album = track_info.get("album")
                        if album and album.get("images"):
                            thumb_url = album.get("images")[0].get("url")
                            
                        tracks.append({
                            "name": name,
                            "artists": ", ".join(artists) if artists else "Unknown Artist",
                            "duration": duration_sec,
                            "thumbnail": thumb_url
                        })
                    next_url = res_data.get("next")
            if tracks:
                return {"tracks": tracks, "playlist_title": playlist_title}
        except Exception as api_err:
            pass # Fallback to embed scraper below

    # Fallback to embed page scraping (no API credentials required)
    return fetch_spotify_tracks_from_embed(playlist_id)

@router.post("/playlist-tracks")
async def get_playlist_tracks(req_body: SpotifyTracksRequest, request: Request):
    # Parse playlist ID
    match = re.search(r'playlist/([a-zA-Z0-9]+)', req_body.url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz Spotify playlist URL'si. / Invalid Spotify playlist URL."
        )
    playlist_id = match.group(1)
    
    # Get credentials from global preferences
    controller = request.app.state.server.controller
    prefs = controller.state.preferences
    client_id = prefs.spotify_client_id
    client_secret = prefs.spotify_client_secret
    
    try:
        # Run blocking network requests in a separate thread
        result = await asyncio.to_thread(fetch_spotify_tracks, playlist_id, client_id, client_secret)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Spotify çözümlenemedi. Detay: {str(e)}"
        )
