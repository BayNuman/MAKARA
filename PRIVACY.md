# Privacy Policy — Makara Pro

**Effective Date:** July 31, 2026  
**Last Updated:** July 31, 2026

Makara Pro ("the Application") is an open-source, desktop-based media management utility. We take user privacy extremely seriously. This Privacy Policy details how data is handled by the Application.

---

## 1. 100% Local Execution & Zero Telemetry

- **No Remote Data Collection:** Makara Pro does **not** collect, store, track, or transmit any personal data, usage analytics, telemetry, IP addresses, or download histories to remote servers.
- **Local Sidecar Architecture:** All processing, HTTP requests, metadata fetching, and file operations take place locally on your computer via the embedded FastAPI sidecar (`127.0.0.1:8765`).

---

## 2. Browser Cookie & Session Handling

- **Read-Only Local Access:** When you enable session-aware browser authentication (via `--cookies-from-browser`), the Application accesses local cookie stores (e.g., Chrome, Firefox, Edge) **strictly on your local machine**.
- **No Transmission:** Cookie data is passed directly into local `yt-dlp` process invocation arguments. Cookie strings are **never** logged to disk, sent to developers, or transmitted to any third-party services.

---

## 3. Clipboard Listener Privacy

- **Privacy Whitelist Filter:** The optional Clipboard Listener feature monitors local system clipboard events strictly for valid media URLs matching specific domain whitelists (e.g., `youtube.com`, `youtu.be`, `spotify.com`).
- **No Non-Media Reading:** Non-matching clipboard text, passwords, or personal data are immediately ignored and never processed or stored.

---

## 4. Open-Source Transparency

Because Makara Pro is 100% open-source under the MIT License, you can inspect the full source code on [GitHub](https://github.com/BayNuman/yt-dlp-downloader-pro) to verify all privacy mechanisms.
