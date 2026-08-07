# core/command_builder.py
import sys
import shlex
import os
import atexit
from pathlib import Path
from typing import Optional
from core.clip import parse_time_to_seconds

_created_temp_files = []

def _cleanup_temp_files():
    for path in _created_temp_files:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

atexit.register(_cleanup_temp_files)

VIDEO_PRESET_HEIGHT = {
    "best": "Best",
    "Best": "Best",
    "Maksimum (Best)": "Best",
    "Maksimum Kalite": "Best",
    "2160": "2160",
    "2160p": "2160",
    "Ultra HD (2160p)": "2160",
    "1440": "1440",
    "1440p": "1440",
    "QHD (1440p)": "1440",
    "1080": "1080",
    "1080p": "1080",
    "Full HD (1080p)": "1080",
    "720": "720",
    "720p": "720",
    "Dengeli (720p)": "720",
    "480": "480",
    "480p": "480",
    "Hizli (480p)": "480",
    "360": "360",
    "360p": "360",
    "Ekonomi (360p)": "360",
    "CUSTOM": "CUSTOM",
    "Custom": "CUSTOM",
    "Ozel (Custom)": "CUSTOM",
}

AUDIO_PRESET_QUALITY = {
    "Best": "0",
    "best": "0",
    "Yuksek (320K)": "320K",
    "Dengeli (192K)": "192K",
    "Kucuk Boyut (128K)": "128K",
}

DEFAULT_OUTPUT_TEMPLATE = "%(title)s [%(id)s].%(ext)s"
YOUTUBE_FALLBACK_EXTRACTOR_ARGS = "youtube:player-client=tv"

def safe_get(obj, key, default=None):
    if isinstance(obj, dict):
        val = obj.get(key, default)
    else:
        val = getattr(obj, key, default)
    return default if val is None else val

def safe_set(obj, key, value):
    if isinstance(obj, dict):
        obj[key] = value
    else:
        setattr(obj, key, value)

def sanitize_extra_args(extra_args_str: str) -> list[str]:
    if not extra_args_str.strip():
        return []
    
    try:
        parts = shlex.split(extra_args_str, posix=False)
    except Exception:
        parts = extra_args_str.split()
        
    SAFE_ARG_PREFIXES = [
        "--sleep-", "--limit-", "--retries", "--socket-timeout", "--proxy",
        "--referer", "--user-agent", "--geo-", "--playlist-", "--yes-", "--no-",
        "--date", "--match-", "--reject-", "--min-", "--max-", "--flat-playlist",
        "--ignore-errors", "--verbose", "--quiet", "--force-", "--cookies",
        "--ffmpeg-", "--audio-", "--extract-audio", "--embed-", "--add-", "--write-",
        "--ignore-config", "--no-config", "--prefer-", "--http-", "--buffer-",
        "--resize-", "--remux-", "--recode-", "--postprocessor-", "--download-sections"
    ]
    SAFE_EXACT_ARGS = {
        "-i", "-v", "-q", "-h", "--help", "--version", "--force-keyframes-at-cuts"
    }
    
    sanitized_parts = []
    skip_next = False
    
    for i, part in enumerate(parts):
        if skip_next:
            skip_next = False
            continue
            
        part_clean = part.strip()
        if part_clean.startswith("-"):
            part_lower = part_clean.lower()
            is_safe = False
            for safe_exact in SAFE_EXACT_ARGS:
                if part_lower == safe_exact:
                    is_safe = True
                    break
            if not is_safe:
                for safe_prefix in SAFE_ARG_PREFIXES:
                    if part_lower.startswith(safe_prefix):
                        is_safe = True
                        break
            if not is_safe:
                print(f"[Security Protection] Blocked dangerous/unlisted parameter: {part}")
                if "=" not in part_clean and i + 1 < len(parts) and not parts[i + 1].strip().startswith("-"):
                    skip_next = True
                continue
                
        sanitized_parts.append(part)
        
    return sanitized_parts

def extract_heatmap_peak_window(video_info: Optional[dict], target_duration: float = 60.0) -> tuple[float, float]:
    """Scans YouTube heatmap data points to find the peak engagement 60-second window."""
    if not video_info or not isinstance(video_info, dict):
        return (0.0, target_duration)
        
    heatmap = video_info.get("heatmap")
    duration = float(video_info.get("duration") or 0.0)
    
    if not heatmap or not isinstance(heatmap, list) or len(heatmap) == 0:
        if duration > 120.0:
            mid = duration / 2.0
            start = max(0.0, mid - (target_duration / 2.0))
            end = min(duration, start + target_duration)
            return (round(start, 2), round(end, 2))
        return (0.0, round(min(duration if duration > 0 else target_duration, target_duration), 2))

    best_start = 0.0
    max_score = -1.0
    
    for i in range(len(heatmap)):
        start_t = float(heatmap[i].get("start_time", 0.0))
        end_window_t = start_t + target_duration
        
        score = 0.0
        for pt in heatmap:
            pt_start = float(pt.get("start_time", 0.0))
            pt_end = float(pt.get("end_time", pt_start + 1.0))
            pt_val = float(pt.get("value", 0.0))
            
            if pt_start < end_window_t and pt_end > start_t:
                score += pt_val
                
        if score > max_score:
            max_score = score
            best_start = start_t
            
    best_end = best_start + target_duration
    if duration > 0 and best_end > duration:
        best_end = duration
        best_start = max(0.0, best_end - target_duration)
        
    return (round(best_start, 2), round(best_end, 2))

def effective_video_height(item) -> Optional[int]:
    raw_profile = str(safe_get(item, "video_profile", "best")).strip()
    selected = VIDEO_PRESET_HEIGHT.get(raw_profile, raw_profile)
    
    if selected.upper() == "CUSTOM":
        val = str(safe_get(item, "video_limit", "1080")).strip()
    else:
        val = selected
        
    if not val or val.lower() in ("best", "maksimum (best)", "maksimum kalite", "max", "none"):
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        import re
        digits = re.sub(r"[^\d]", "", val)
        if digits:
            return int(digits)
        return 1080

def build_command(item, output_dir: str) -> list[str]:
    import tempfile
    import json
    
    out_dir = str(Path(output_dir).expanduser())
    folder_org = str(safe_get(item, "folder_org", "None")).strip()
    
    if folder_org and folder_org != "None":
        if folder_org == "Channel":
            output_template = "%(uploader).30s/%(title).70s [%(id)s].%(ext)s"
        elif folder_org == "Year":
            output_template = "%(upload_date>%Y)s/%(title).70s [%(id)s].%(ext)s"
        elif folder_org == "Format":
            output_template = "%(ext)s/%(title).70s [%(id)s].%(ext)s"
        elif folder_org == "Channel_Year":
            output_template = "%(uploader).30s/%(upload_date>%Y)s/%(title).70s [%(id)s].%(ext)s"
        elif folder_org == "Playlist":
            custom_title = safe_get(item, "playlist_title")
            if custom_title:
                import re
                safe_folder = re.sub(r'[\\/:*?"<>|]', '_', str(custom_title)).strip()
                output_template = f"{safe_folder}/%(title).70s [%(id)s].%(ext)s"
            else:
                output_template = "%(playlist_title,playlist,Music_Playlist)s/%(title).70s [%(id)s].%(ext)s"
        else:
            output_template = DEFAULT_OUTPUT_TEMPLATE
    elif safe_get(item, "playlist_title"):
        import re
        custom_title = safe_get(item, "playlist_title")
        safe_folder = re.sub(r'[\\/:*?"<>|]', '_', str(custom_title)).strip()
        output_template = f"{safe_folder}/%(title).70s [%(id)s].%(ext)s"
    else:
        output_template = str(safe_get(item, "output_template", "")).strip() or DEFAULT_OUTPUT_TEMPLATE
        
    cmd: list[str] = [sys.executable, "-m", "yt_dlp", "--newline", "--legacy-server-connect", "-P", out_dir, "-o", output_template]

    # Pre-dump metadata if cached json exists
    video_info = safe_get(item, "_video_info")
    if video_info and isinstance(video_info, dict):
        try:
            scratch_path = Path.home() / ".yt-downloader-scratch"
            scratch_path.mkdir(parents=True, exist_ok=True)
            
            temp_json = tempfile.NamedTemporaryFile(
                dir=str(scratch_path),
                mode="w",
                delete=False,
                suffix=".json",
                encoding="utf-8"
            )
            json.dump(video_info, temp_json, ensure_ascii=False)
            temp_json.close()
            safe_set(item, "_temp_info_json", temp_json.name)
            cmd.extend(["--load-info-json", temp_json.name])
        except Exception as e:
            print(f"[warning] Failed to write --load-info-json temp file: {e}")

    mode = safe_get(item, "mode", "Video")
    if mode == "Video":
        quality = effective_video_height(item)
        audio_codec = str(safe_get(item, "video_audio_codec", "AAC")).strip().upper()
        if audio_codec.startswith("AAC"):
            preferred_audio_selector = "ba[acodec^=mp4a]"
            secondary_audio_selector = "ba[ext=m4a]"
        else:
            preferred_audio_selector = "ba[acodec*=opus]"
            secondary_audio_selector = "ba[ext=webm]"
            
        if quality is None:
            video_selector = "bv*"
            fallback_selector = "b"
        else:
            video_selector = f"bv*[height<=?{quality}]"
            fallback_selector = f"b[height<=?{quality}]"

        selector = (
            f"{video_selector}+{preferred_audio_selector}/"
            f"{video_selector}+{secondary_audio_selector}/"
            f"{video_selector}+ba/"
            f"{fallback_selector}"
        )
        cmd.extend(["-f", selector, "--merge-output-format", safe_get(item, "video_container", "mp4")])
    else:
        raw_aq = str(safe_get(item, "audio_quality", "Best")).strip()
        audio_quality = AUDIO_PRESET_QUALITY.get(raw_aq, raw_aq if raw_aq.endswith("K") or raw_aq.isdigit() else "0")
        cmd.extend(["-x", "--audio-format", safe_get(item, "audio_format", "mp3"), "--audio-quality", audio_quality])

    if not safe_get(item, "playlist"):
        cmd.append("--no-playlist")
    if safe_get(item, "metadata") or safe_get(item, "metadata_flag"):
        cmd.append("--add-metadata")
    if safe_get(item, "thumbnail_flag"):
        cmd.append("--embed-thumbnail")
    sub_langs = str(safe_get(item, "sub_langs", "tr,en")).strip()
    if not sub_langs:
        sub_langs = "tr,en"
    
    lang_parts = [l.strip() for l in sub_langs.split(",") if l.strip()]
    expanded_langs = []
    for l in lang_parts:
        if l not in expanded_langs:
            expanded_langs.append(l)
        if l != "all" and not l.endswith("*"):
            pattern1 = f"{l}-*"
            pattern2 = f"{l}.*"
            if pattern1 not in expanded_langs:
                expanded_langs.append(pattern1)
            if pattern2 not in expanded_langs:
                expanded_langs.append(pattern2)
    final_sub_langs = ",".join(expanded_langs)

    has_subs = safe_get(item, "subs") or safe_get(item, "subtitle_flag")
    has_auto_subs = safe_get(item, "auto_subs") or safe_get(item, "auto_subtitle_flag")

    if has_subs or has_auto_subs:
        cmd.append("--ignore-errors")
    if has_subs:
        cmd.extend(["--write-subs", "--sub-langs", final_sub_langs, "--convert-subs", "srt"])
    if has_auto_subs:
        cmd.extend(["--write-auto-subs", "--sub-langs", final_sub_langs, "--convert-subs", "srt"])
    if (has_subs or has_auto_subs) and safe_get(item, "embed_subs", True):
        cmd.append("--embed-subs")
    if safe_get(item, "restrict_names") or safe_get(item, "restrict_filenames") or (folder_org and folder_org != "None"):
        cmd.append("--restrict-filenames")

    if safe_get(item, "sponsorblock") or safe_get(item, "sponsorblock_enabled"):
        cmd.extend(["--sponsorblock-remove", "all"])

    playlist_items = str(safe_get(item, "playlist_items", "")).strip()
    if playlist_items:
        cmd.extend(["--playlist-items", playlist_items.replace(" ", "")])

    max_downloads = str(safe_get(item, "max_downloads", "")).strip()
    if max_downloads:
        cmd.extend(["--max-downloads", max_downloads])

    rate_limit = str(safe_get(item, "rate_limit", "")).strip()
    if rate_limit:
        cmd.extend(["--limit-rate", rate_limit])

    if safe_get(item, "archive") and not safe_get(item, "allow_redownload"):
        from core.history import get_app_data_dir
        archive_file = str(get_app_data_dir() / "download_archive.txt")
        cmd.extend(["--download-archive", archive_file])

    retries = str(safe_get(item, "retries", "")).strip()
    if retries:
        cmd.extend(["--retries", retries])
    else:
        cmd.extend(["--retries", "10"])

    # Protect against infinite TCP socket hangs on unstable/throttled connections
    cmd.extend(["--socket-timeout", "30"])

    from core.downloader import resolve_ffmpeg_path
    ffmpeg_bin = resolve_ffmpeg_path()
    if ffmpeg_bin and ffmpeg_bin != "ffmpeg" and os.path.exists(ffmpeg_bin):
        cmd.extend(["--ffmpeg-location", os.path.dirname(ffmpeg_bin)])

    concurrent_fragments = str(safe_get(item, "concurrent_fragments", "")).strip()
    if concurrent_fragments:
        cmd.extend(["--concurrent-fragments", concurrent_fragments])

    cookies_file = str(safe_get(item, "cookies", "")).strip()
    if not cookies_file:
        from core.history import get_app_data_dir
        synced_cookies = get_app_data_dir() / "user_cookies.txt"
        if synced_cookies.exists() and synced_cookies.stat().st_size > 0:
            cookies_file = str(synced_cookies)

    if cookies_file:
        cmd.extend(["--cookies", cookies_file])
    else:
        browser_cookies = str(safe_get(item, "browser_cookies", "")).strip().lower()
        if browser_cookies and browser_cookies not in ("kapali", "disabled", "off", "closed", "none", "auto"):
            cmd.extend(["--cookies-from-browser", browser_cookies])

    if safe_get(item, "auto_shorts") or safe_get(item, "crop_vertical"):
        video_info = safe_get(item, "_video_info")
        start_sec, end_sec = extract_heatmap_peak_window(video_info, 60.0)
        cmd.extend([
            "--download-sections", f"*{start_sec}-{end_sec}",
            "--force-keyframes-at-cuts",
            "--postprocessor-args", f"ffmpeg:-ss {start_sec} -to {end_sec} -vf crop=ih*9/16:ih -avoid_negative_ts make_zero"
        ])
    elif safe_get(item, "clip_enabled"):
        clip_strategy = safe_get(item, "clip_strategy", "stream_seek")
        # DESIGN NOTE (full_trim): Under "full_trim", we intentionally do NOT inject yt-dlp section downloads.
        # This is an intentional design contract: the whole file is downloaded first, then trimmed in downloader.py
        # post-processing using FFmpeg to guarantee frame accuracy and codec stability.
        start_str = str(safe_get(item, "clip_start", "00:00")).strip()
        end_str = str(safe_get(item, "clip_end", "00:00")).strip()
        
        start = parse_time_to_seconds(start_str) or 0.0
        end = parse_time_to_seconds(end_str) or 0.0
        
        if clip_strategy == "hybrid":
            buffer = 5.0
            buffered_start = max(0.0, start - buffer)
            buffered_end = end + buffer
            cmd.extend([
                "--download-sections", f"*{buffered_start}-{buffered_end}",
                "--force-keyframes-at-cuts"
            ])
        elif clip_strategy == "stream_seek" or clip_strategy == "precise_cut":
            cmd.extend([
                "--download-sections", f"*{start_str}-{end_str}",
                "--force-keyframes-at-cuts"
            ])
            if safe_get(item, "clip_precise") or clip_strategy == "precise_cut":
                cmd.extend([
                    "--postprocessor-args",
                    f"ffmpeg:-ss {start_str} -to {end_str} -avoid_negative_ts make_zero"
                ])

    extra_args = str(safe_get(item, "extra_args", "")).strip()
    if extra_args:
        cmd.extend(sanitize_extra_args(extra_args))

    cmd.append(safe_get(item, "url"))
    return cmd

def format_cmd_for_log(cmd: list[str]) -> str:
    safe_parts = []
    for part in cmd:
        if " " in part or "\t" in part:
            safe_parts.append(f'"{part}"')
        else:
            safe_parts.append(part)
    return " ".join(safe_parts)
