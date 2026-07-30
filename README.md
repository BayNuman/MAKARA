# 📼 Makara Pro — Advanced Media & Spotify Downloader (Powered by yt-dlp & Tauri)

<p align="center">
  <b>🇺🇸 English</b> &nbsp;·&nbsp;
  <a href="README.tr.md">🇹🇷 Türkçe</a> &nbsp;·&nbsp;
  <a href="PRIVACY.md">🔒 Privacy Policy</a> &nbsp;·&nbsp;
  <a href="TERMS.md">⚖️ Terms & Disclaimer</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078d4?logo=windows)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208%2B-3ddc84?logo=android)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Android CI](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml/badge.svg)](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml)
[![Stars](https://img.shields.io/github/stars/BayNuman/yt-dlp-downloader-pro?style=social)](https://github.com/BayNuman/yt-dlp-downloader-pro/stargazers)

> **Makara Pro** (released under working repository `yt-dlp-downloader-pro`) is a high-performance cross-platform video, audio, and Spotify media manager powered by **Rust Tauri**, **React/Vite**, **yt-dlp**, and an embedded **FastAPI (Python 3.13)** sidecar backend.
> 
> Designed for local execution, zero-polling background waiting, and clean decoupled architecture.

---

## 📥 Downloads & Installation

| Platform | Package | Release Asset |
| :--- | :--- | :--- |
| **🖥️ Windows** | Setup Installer (Recommended) | [📥 Download Setup.exe (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0-setup.exe) |
| **🖥️ Windows** | MSI Enterprise Package | [📥 Download Package.msi (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0.msi) |
| **📱 Android** | APK (Android 8.0+) | [📥 Download App.apk](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/app-release.apk) |

> [!NOTE]
> **Bundled Runtimes:** All desktop releases include pre-packaged Python sidecar executables, `yt-dlp` core, and `FFmpeg` binaries. No external system installations required.

---

## 🛡️ Windows SmartScreen & Security Verification

Because Makara Pro is an open-source project built without expensive commercial EV Code-Signing Certificates, Windows Defender / SmartScreen may display an *"Unknown Publisher"* notification on first launch.

### How to Bypass SmartScreen:
1. Click **"More info"** on the Windows Defender prompt.
2. Click **"Run anyway"**.

### File Integrity (SHA-256 Verification)
You can verify the cryptographic hash of downloaded executables in PowerShell:
```powershell
Get-FileHash -Algorithm SHA256 .\yt-dlp-downloader-pro-v2.2.0-setup.exe
```

---

## 🚀 Key Feature Comparisons

| Feature | Generic Downloaders | Makara Pro | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **Spotify Playlist Resolution** | ❌ (Cannot resolve Spotify links) | ✅ Zero-Config Dual Engine | Public Embed Metadata Resolver + Web API Fallback |
| **Task Scheduling** | 🐢 High-CPU Polling Loops | ⚡ Event-Driven Delay Waiting | `threading.Condition` kernel sleep (Zero-polling wait loops) |
| **Authenticated Session Media** | ❌ | ✅ Local Session-Aware Auth | Local read-only browser cookie import (`--cookies-from-browser`) |
| **Synced Lyrics Embedding** | ❌ | ✅ LRCLIB `.lrc` Integration | Timestamped lyrics fetched & embedded into MP3 (`USLT`) / FLAC tags |
| **Clipboard Auto-Detection** | ❌ | ✅ Privacy-First Whitelist | Domain regex validation ignoring non-media clipboard text |
| **Browser Extension** | ❌ | ✅ Manifest V3 Companion | Direct REST communication (`127.0.0.1:8765`) via background worker |

---

## 🔒 Privacy & Data Handling

Makara Pro executes **100% locally on your machine**. 
- No telemetry, usage analytics, or remote tracking.
- Browser cookies are read strictly locally and never transmitted to third parties or developer servers.
- Read our full [Privacy Policy](PRIVACY.md) and [Terms of Service](TERMS.md).

---

## 📸 Desktop Interface

<table align="center">
<tr>
<td align="center"><img src="assets/screenshots/desktop_forest.png" alt="Makara Pro — Forest Theme" width="450"/><br><sub>Forest Glass Theme</sub></td>
<td align="center"><img src="assets/screenshots/desktop_makara.png" alt="Makara Pro — Vintage Dark Theme" width="450"/><br><sub>Makara Vintage Dark Theme</sub></td>
</tr>
</table>
