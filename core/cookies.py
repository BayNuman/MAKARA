# core/cookies.py
"""
yt-dlp Downloader Pro - Browser Cookie Registry & Auto-Detection Engine
Detects installed web browsers on the host OS for zero-config age-restricted and member video downloads.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any

SUPPORTED_BROWSERS = [
    {"id": "disabled", "name": "Devre Dışı / Disabled"},
    {"id": "chrome", "name": "Google Chrome"},
    {"id": "firefox", "name": "Mozilla Firefox"},
    {"id": "edge", "name": "Microsoft Edge"},
    {"id": "brave", "name": "Brave Browser"},
    {"id": "opera", "name": "Opera"},
    {"id": "vivaldi", "name": "Vivaldi"},
    {"id": "safari", "name": "Safari"}
]

def get_installed_browsers() -> List[Dict[str, Any]]:
    """Scans host OS user application data directories to detect installed web browsers."""
    installed = [{"id": "disabled", "name": "Devre Dışı / Disabled", "installed": True}]

    home = Path.home()
    if sys.platform == "win32":
        local_app_data = Path(os.environ.get("LOCALAPPDATA", home / "AppData/Local"))
        app_data = Path(os.environ.get("APPDATA", home / "AppData/Roaming"))

        browser_paths = {
            "chrome": local_app_data / "Google/Chrome/User Data",
            "edge": local_app_data / "Microsoft/Edge/User Data",
            "brave": local_app_data / "BraveSoftware/Brave-Browser/User Data",
            "firefox": app_data / "Mozilla/Firefox/Profiles",
            "opera": app_data / "Opera Software/Opera Stable",
            "vivaldi": local_app_data / "Vivaldi/User Data"
        }
    elif sys.platform == "darwin":
        app_support = home / "Library/Application Support"
        browser_paths = {
            "chrome": app_support / "Google/Chrome",
            "firefox": app_support / "Firefox/Profiles",
            "safari": home / "Library/Safari",
            "edge": app_support / "Microsoft Edge",
            "brave": app_support / "BraveSoftware/Brave-Browser",
            "opera": app_support / "com.operasoftware.Opera",
            "vivaldi": app_support / "Vivaldi"
        }
    else:  # Linux / Unix
        config = home / ".config"
        browser_paths = {
            "chrome": config / "google-chrome",
            "firefox": home / ".mozilla/firefox",
            "edge": config / "microsoft-edge",
            "brave": config / "BraveSoftware/Brave-Browser",
            "opera": config / "opera",
            "vivaldi": config / "vivaldi"
        }

    for b in SUPPORTED_BROWSERS:
        b_id = b["id"]
        if b_id == "disabled":
            continue
        p = browser_paths.get(b_id)
        is_installed = p.exists() if p else False
        installed.append({
            "id": b_id,
            "name": b["name"],
            "installed": is_installed
        })

    return installed

def validate_cookies_arg(browser_or_file: str) -> tuple[str, str]:
    """
    Validates whether cookies_arg is a valid browser name or a local cookies.txt file path.
    Returns tuple: (arg_type, validated_value) where arg_type is 'browser', 'file', or 'disabled'.
    """
    if not browser_or_file or browser_or_file == "disabled":
        return ("disabled", "")

    valid_browser_ids = {b["id"] for b in SUPPORTED_BROWSERS if b["id"] != "disabled"}
    val_lower = browser_or_file.lower().strip()

    if val_lower in valid_browser_ids:
        return ("browser", val_lower)

    if os.path.exists(browser_or_file) and os.path.isfile(browser_or_file):
        return ("file", browser_or_file)

    return ("disabled", "")
