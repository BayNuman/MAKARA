# 📼 Makara Pro — Gelişmiş Medya & Spotify İndirici (yt-dlp & Tauri Gücüyle)

<p align="center">
  <a href="README.md">🇺🇸 English</a> &nbsp;·&nbsp;
  <b>🇹🇷 Türkçe</b> &nbsp;·&nbsp;
  <a href="PRIVACY.md">🔒 Gizlilik Politikası</a> &nbsp;·&nbsp;
  <a href="TERMS.md">⚖️ Kullanım Şartları</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078d4?logo=windows)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208%2B-3ddc84?logo=android)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases)
[![Android CI](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml/badge.svg)](https://github.com/BayNuman/yt-dlp-downloader-pro/actions/workflows/android-ci.yml)
[![Stars](https://img.shields.io/github/stars/BayNuman/yt-dlp-downloader-pro?style=social)](https://github.com/BayNuman/yt-dlp-downloader-pro/stargazers)

> **Makara Pro** (resmi deposu `yt-dlp-downloader-pro` adıyla sunulmaktadır); **Rust Tauri**, **React/Vite**, **yt-dlp** ve gömülü **FastAPI (Python 3.13)** arka uç mimarisiyle geliştirilmiş, cam derinlikli (glassmorphic) şık arayüze sahip yüksek performanslı bir medya yöneticisidir.
> 
> Tamamen yerel çalışma, uykuda bekleyen event-driven zamanlayıcı ve ayrıştırılmış modüler mimari için tasarlanmıştır.

---

## 📥 Hızlı İndirme Linkleri

| Platform | Paket Türü | Yayın Paketi |
| :--- | :--- | :--- |
| **🖥️ Windows** | Kurulumcu (Önerilen) | [📥 Setup.exe İndir (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0-setup.exe) |
| **🖥️ Windows** | MSI Paketi | [📥 Package.msi İndir (v2.2.0)](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/yt-dlp-downloader-pro-v2.2.0.msi) |
| **📱 Android** | APK (Android 8.0+) | [📥 Uygulama APK İndir](https://github.com/BayNuman/yt-dlp-downloader-pro/releases/latest/download/app-release.apk) |

> [!NOTE]
> **Gömülü Çalışma Zamanı (Bundled Dependencies):** Uygulama paketleri içerisinde Python sidecar servisi, `yt-dlp` çekirdeği ve `FFmpeg` ikili dosyaları paketlenmiş olarak gelir. Sisteminize ayrıca Python veya FFmpeg kurmanız gerekmez.

---

## 🛡️ Windows SmartScreen ve Güvenlik Doğrulaması

Makara Pro, açık kaynaklı ve ücretsiz bir proje olduğu için ticari EV Kod İmzalama Sertifikası kullanılmamaktadır. Bu nedenle Windows Defender / SmartScreen ilk çalıştırmada *"Bilinmeyen Yayıncı (Unknown Publisher)"* uyarısı verebilir.

### SmartScreen Uyarısını Geçme:
1. Ekrana gelen Windows Defender penceresinde **"Ek Bilgi (More Info)"** seçeneğine tıklayın.
2. Açılan alt kısımdan **"Yine de Çalıştır (Run Anyway)"** butonuna basın.

### Dosya Doğrulaması (SHA-256 Checksum)
İndirdiğiniz kurulum dosyasının bütünlüğünü PowerShell üzerinden doğrulayabilirsiniz:
```powershell
Get-FileHash -Algorithm SHA256 .\yt-dlp-downloader-pro-v2.2.0-setup.exe
```

---

## 🚀 Öne Çıkan Teknik Özellikler

| Özellik | Diğer İndiriciler | Makara Pro | Teknik Uygulama Mimarisi |
| :--- | :--- | :--- | :--- |
| **Spotify Çalma Listesi Çözümleme** | ❌ (Çözümleyemez) | ✅ Çift Motorlu Çözücü | Kamu Gömdü Meta Çözücü + Web API Yedekleme |
| **Görev Zamanlayıcı** | 🐢 CPU Yoran Döngüler | ⚡ Event-Driven Uykuda Bekleme | `threading.Condition` kernel sleep (Sıfır polling yükü) |
| **Oturum Odaklı İçerik İndirme** | ❌ | ✅ Yerel Oturum Kimlik Doğrulama | Yerel tarayıcı çerez içe aktarımı (`--cookies-from-browser`) |
| **Senkronize Şarkı Sözleri** | ❌ | ✅ LRCLIB Entegrasyonu | Zamanlı sözler çekilir ve MP3 (`USLT`) / FLAC etiketlerine gömülür |
| **Pano Otomatik Algılama** | ❌ | ✅ Gizlilik Odaklı Filtre | Yalnızca medya URL regex eşleşmelerini okuyan pano takipçisi |
| **Tarayıcı Eklentisi** | ❌ | ✅ Manifest V3 Companion | Arka plan servisi üzerinden yerel REST (`127.0.0.1:8765`) iletişimi |

---

## 🔒 Gizlilik ve Veri Güvenliği

Makara Pro **%100 yerel olarak bilgisayarınızda çalışır**.
- Telemetri, kullanım analitiği veya uzak sunucu takibi içermez.
- Tarayıcı çerezleri yalnızca yerel bilgisayarınızda okunur; üçüncü şahıslara veya geliştirici sunucularına iletilmez.
- Detaylı [Gizlilik Politikası (PRIVACY.md)](PRIVACY.md) ve [Kullanım Şartlarını (TERMS.md)](TERMS.md) inceleyebilirsiniz.

---

## 📸 Masaüstü Arayüzü

<table align="center">
<tr>
<td align="center"><img src="assets/screenshots/desktop_forest.png" alt="Makara Pro — Forest Theme" width="450"/><br><sub>Forest Glass Teması</sub></td>
<td align="center"><img src="assets/screenshots/desktop_makara.png" alt="Makara Pro — Vintage Dark Theme" width="450"/><br><sub>Makara Vintage Dark Teması</sub></td>
</tr>
</table>
