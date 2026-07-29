# server_app.py
"""
yt-dlp Downloader Pro - FastAPI Backend Sidecar Entry Point & CLI Dispatcher
"""
import sys
import os
import multiprocessing
import uvicorn
from core.env import refresh_path_env

# 1. Refresh paths to ensure ffmpeg and yt-dlp runtimes are in PATH
refresh_path_env()

if __name__ == "__main__":
    # 2. Call freeze_support for PyInstaller Windows executable multiprocessing support
    multiprocessing.freeze_support()

    # 3. Check if invoked as CLI wrapper (e.g. server-sidecar.exe -m yt_dlp ...)
    if "-m" in sys.argv:
        try:
            m_idx = sys.argv.index("-m")
            if m_idx + 1 < len(sys.argv) and sys.argv[m_idx + 1] == "yt_dlp":
                import yt_dlp
                sys.argv = [sys.argv[0]] + sys.argv[m_idx + 2:]
                sys.exit(yt_dlp.main())
        except SystemExit as e:
            sys.exit(e.code if isinstance(e.code, int) else 0)
        except Exception as e:
            print(f"[ERROR] yt-dlp CLI execution error: {e}", file=sys.stderr)
            sys.exit(1)

    # 4. If this is a multiprocessing child process spawned by PyInstaller, exit cleanly
    if any(arg.startswith("--multiprocessing-fork") for arg in sys.argv):
        sys.exit(0)

    # 5. Otherwise, boot up FastAPI server on localhost:8765
    uvicorn.run("server.main:app", host="127.0.0.1", port=8765, log_level="info", workers=1)


