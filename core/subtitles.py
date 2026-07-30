# core/subtitles.py
"""
yt-dlp Downloader Pro - Subtitle & Auto-Translation Engine
Provides language selection and CLI argument construction for manual/auto subtitles.
"""

from typing import List, Dict, Any

POPULAR_SUBTITLE_LANGS = [
    {"code": "tr", "name": "Türkçe (Turkish)"},
    {"code": "en", "name": "English (İngilizce)"},
    {"code": "es", "name": "Español (İspanyolca)"},
    {"code": "de", "name": "Deutsch (Almanca)"},
    {"code": "fr", "name": "Français (Fransızca)"},
    {"code": "it", "name": "Italiano (İtalyanca)"},
    {"code": "ru", "name": "Русский (Rusça)"},
    {"code": "ja", "name": "日本語 (Japonca)"},
    {"code": "ko", "name": "한국어 (Korece)"},
    {"code": "zh", "name": "中文 (Çince)"},
    {"code": "all", "name": "Tüm Diller (All Languages)"}
]

def build_subtitle_cli_args(
    write_subs: bool = False,
    write_auto_subs: bool = False,
    sub_langs: str = "tr,en",
    embed_subs: bool = False,
    format_srt: bool = True
) -> List[str]:
    """Constructs clean, optimal yt-dlp CLI arguments for subtitle extraction and embedding."""
    if not write_subs and not write_auto_subs:
        return []

    args = []

    if write_subs:
        args.append("--write-subs")
    if write_auto_subs:
        args.append("--write-auto-subs")

    # Clean language selection string
    langs = sub_langs.strip() if sub_langs else "tr,en"
    args.extend(["--sub-langs", langs])

    if format_srt:
        args.extend(["--convert-subs", "srt"])

    if embed_subs:
        args.append("--embed-subs")

    return args
