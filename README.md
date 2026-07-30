# 📼 Makara Pro — Next-Gen Media & Spotify Downloader

<p align="center">
  <b>🇺🇸 English</b> &nbsp;·&nbsp;
  <a href="README.tr.md">🇹🇷 Türkçe</a> &nbsp;·&nbsp;
  <a href="README.es.md">🇪🇸 Español</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078d4?logo=windows)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208%2B-3ddc84?logo=android)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Android CI](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml/badge.svg)](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml)
[![Stars](https://img.shields.io/github/stars/BayNuman/yt-dlp-downloader-pro?style=social)](https://github.com/BayNuman/yt-dlp-downloader-pro/stargazers)

> **Makara Pro** (formerly *yt-dlp Downloader Pro*) is a premium, high-performance cross-platform video, audio, and Spotify media manager powered by **Rust Tauri**, **React/Vite**, **yt-dlp**, and an embedded **FastAPI (Python 3.13)** sidecar backend.
> 
> Key features include **Zero-Config Spotify Playlist Resolving**, **Smart Clipboard Listener**, **Synced LRCLIB Lyrics Embedding**, **Zero-CPU Task Scheduler**, **Native OS Browser Cookie Detector**, and **Chrome / Edge Extension Companion**.

---

## 📥 Fast Downloads

| Platform | Format | Release Package |
| :--- | :--- | :--- |
| **🖥️ Windows** | Installer (Recommended) | [📥 Download Setup.exe (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0-setup.exe) |
| **🖥️ Windows** | MSI Package | [📥 Download Package.msi (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0.msi) |
| **📱 Android** | APK (Android 8.0+) | [📥 Download App.apk](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/app-release.apk) |

---

## 🚀 Key Features

| Feature | Generic Downloader | Makara Pro |
| :--- | :--- | :--- |
| **Spotify Playlist Downloader** | ❌ (Cannot parse Spotify links) | ✅ Dual-Engine (API + Embed Scraper) zero-config playlist resolver |
| **Smart Clipboard Listener** | ❌ | ✅ Auto-detects media URLs on focus with privacy whitelist regex |
| **Synced LRCLIB Lyrics** | ❌ | ✅ Queries LRCLIB & embeds `.lrc` timestamped lyrics into MP3/FLAC |
| **Zero-CPU Task Scheduler** | ❌ | ✅ Event-driven `threading.Condition` delay waiting (Zero CPU overhead) |
| **OS Cookie Detector** | ❌ | ✅ Auto-detects Chrome, Firefox, Edge, Brave, Opera for age-restricted videos |
| **Chrome / Edge Extension** | ❌ | ✅ Manifest V3 companion with 1-click & right-click context menu |

---

## 📸 Desktop Screenshots

<table align="center">
<tr>
<td align="center"><img src="assets/screenshots/desktop_forest.png" alt="Windows — Forest Theme" width="450"/></td>
<td align="center"><img src="assets/screenshots/desktop_makara.png" alt="Windows — Makara Vintage Dark Theme" width="450"/></td>
</tr>
<tr>
<td align="center"><em>Forest (Midnight Green) Theme</em></td>
<td align="center"><em>Makara (Vintage Dark) Theme</em></td>
</tr>
<tr>
<td align="center" colspan="2"><img src="assets/screenshots/desktop_night_blue.png" alt="Windows — Night Blue Theme" width="450"/></td>
</tr>
<tr>
<td align="center" colspan="2"><em>Night Blue (Ocean) Theme</em></td>
</tr>
</table>

---

## 📱 Android Screenshots

<table>
<tr>
<td><img src="assets/screenshots/android_dark.jpg" alt="Android — Download" width="160"/></td>
<td><img src="assets/screenshots/android_queue.png" alt="Android — Queue" width="160"/></td>
<td><img src="assets/screenshots/android_history.png" alt="Android — History" width="160"/></td>
<td><img src="assets/screenshots/android_settings.png" alt="Android — Settings" width="160"/></td>
</tr>
<tr>
<td align="center"><em>Download</em></td>
<td align="center"><em>Queue</em></td>
<td align="center"><em>History</em></td>
<td align="center"><em>Settings</em></td>
</tr>
</table>

---

## 📦 Installation & Setup

### 🖥️ Windows Standalone Installation
1. Download **[yt-dlp-downloader-pro-v2.0.0-setup.exe](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.0.0-setup.exe)**.
2. Double-click the installer and complete the setup wizard (~20 seconds).
3. The app is completely self-contained with bundled Python sidecar, FFmpeg, and FFprobe.

### 📱 Android Installation
1. Download **[app-release.apk](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/app-release.apk)**.
2. Enable **Install from Unknown Sources** in your Android security settings.
3. Open the APK file and tap **Install**.

---

## 🛠️ Building From Source

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Rust** & **Cargo** (latest stable)
- **Python** (v3.10+)

### Building Desktop App (Tauri + FastAPI)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/BayNuman/yt-dlp-downloader-pro.git
   cd yt-dlp-downloader-pro
   ```
2. **Install Python virtual environment & dependencies:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Compile Python Sidecar Backend:**
   ```bash
   python build_sidecar.py
   ```
4. **Install Frontend Dependencies & Run Dev Mode:**
   ```bash
   cd frontend
   npm install
   npx @tauri-apps/cli dev
   ```
5. **Build Standalone Production Installer (`.exe` / `.msi`):**
   ```bash
   npx @tauri-apps/cli build
   ```

---

## 🏗️ System Architecture

```text
yt-dlp-downloader-pro/
│
├── 🖥️ Desktop Frontend (React + TypeScript + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/      # Glassmorphic UI Panels (Url, Preview, Queue, Progress, Advanced)
│   │   ├── store/           # Global state manager with Zustand
│   │   ├── hooks/           # WebSocket real-time progress stream hook
│   │   └── i18n/            # Multi-language translations (EN, TR, ES)
│   └── src-tauri/           # Rust Tauri App Shell & Sidecar Process Lifecycle Controller
│
├── ⚙️ Desktop Backend (FastAPI + Python 3.13)
│   ├── server/              # REST & WebSocket API endpoints (/metadata, /queue, /spotify, /download)
│   ├── core/                # Download tasks controller, yt-dlp engine, FFmpeg merger & SponsorBlock
│   └── build_sidecar.py     # PyInstaller standalone sidecar bundler
│
└── 📱 Mobile App (Android - Kotlin + Jetpack Compose)
    └── android/             # Native Android App with Foreground Service & yt-dlp binary runner
```

---

## 🌍 Supported Platforms

Powered by `yt-dlp`, this application supports over **1000+ video & audio streaming sites**:

YouTube • Spotify (via YouTube search) • YouTube Music • Vimeo • SoundCloud • Twitter/X • Instagram • TikTok • Facebook • Dailymotion • Twitch • Reddit • Bandcamp • and more...

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">

Made with ❤️ by [BayNuman](https://github.com/BayNuman)

[**🧡 Become a Patron on Patreon**](https://patreon.com/BayNuman)

If you find this project useful, don't forget to give it a ⭐ on GitHub!

</div>
