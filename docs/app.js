// website/app.js - Makara Pro Interactive Landing Page Logic

document.addEventListener("DOMContentLoaded", () => {
  const simUrlInput = document.getElementById("simUrlInput");
  const simStartBtn = document.getElementById("simStartBtn");
  const simStatusText = document.getElementById("simStatusText");
  const simOutputContent = document.getElementById("simOutputContent");
  const sampleBtns = document.querySelectorAll(".sample-btn");
  const githubStarBtn = document.getElementById("githubStarBtn");

  // 1. Fetch live GitHub star count
  async function fetchGitHubStars() {
    try {
      const res = await fetch("https://api.github.com/repos/BayNuman/yt-dlp-downloader-pro");
      if (res.ok) {
        const data = await res.json();
        if (data.stargazers_count !== undefined) {
          const starSpan = githubStarBtn.querySelector("span");
          starSpan.textContent = `★ ${data.stargazers_count} Stars on GitHub`;
        }
      }
    } catch (e) {
      // Silently keep default label if offline/rate-limited
    }
  }
  fetchGitHubStars();

  // 2. Interactive Sample Link Selector Buttons
  sampleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      simUrlInput.value = url;
      runSimulation(url, btn.getAttribute("data-mode"), btn.getAttribute("data-title"));
    });
  });

  // 3. Main Simulator Trigger
  simStartBtn.addEventListener("click", () => {
    const url = simUrlInput.value.trim();
    if (!url) return;

    if (url.includes("spotify.com")) {
      runSimulation(url, "spotify", "Spotify Playlist (50 Tracks Resolved)");
    } else if (url.includes("podcast") || url.includes("20MitvTf0nk")) {
      runSimulation(url, "podcast", "Tech Podcast (SponsorBlock + Altyazılı)");
    } else {
      runSimulation(url, "youtube", "Queen - Bohemian Rhapsody (Official 4K Remaster)");
    }
  });

  // 4. Live Simulation Engine Logic
  function runSimulation(url, mode, titleHint) {
    simStatusText.textContent = "Çözümleniyor: FastAPI Sidecar katmanına gönderildi...";
    simOutputContent.innerHTML = `
      <div class="sim-placeholder">
        <div class="reel-icon" style="width:48px;height:48px;margin-bottom:12px;">
          <svg viewBox="0 0 100 100" class="spin-reel" style="color:#e8a33d;">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="6"/>
            <circle cx="50" cy="50" r="16" fill="currentColor"/>
          </svg>
        </div>
        <p style="font-family:var(--font-mono);font-size:13px;color:var(--accent);">Medya meta verileri taranıyor & SponsorBlock kontrol ediliyor...</p>
      </div>
    `;

    setTimeout(() => {
      simStatusText.textContent = "✅ Başarılı: Medya meta verisi ve şarkı sözleri hazır!";
      
      if (mode === "spotify") {
        renderSpotifySimOutput(url, titleHint);
      } else if (mode === "podcast") {
        renderPodcastSimOutput(url, titleHint);
      } else {
        renderYouTubeSimOutput(url, titleHint);
      }
    }, 1200);
  }

  function renderSpotifySimOutput(url, title) {
    simOutputContent.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;animation:fadeIn 0.4s;">
        <div style="display:flex;align-items:center;gap:14px;background:#14110f;padding:14px;border-radius:10px;border:1px solid var(--border);">
          <div style="width:54px;height:54px;background:#1e1916;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">🎵</div>
          <div style="flex:1;">
            <h4 style="font-size:15px;font-weight:700;color:var(--text);">${title}</h4>
            <p style="font-size:12px;color:var(--text-dim);margin-top:2px;">Spotify Embed Scraper Engine · Sıfır-Kurulum · 50 Şarkı Algılandı</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:11px;color:#3fb950;background:rgba(46,160,67,0.15);padding:4px 10px;border-radius:20px;">HAZIR</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#14110f;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);font-size:12px;">
            <span style="color:var(--text-faint);display:block;font-size:10px;text-transform:uppercase;">Çözücü Modu</span>
            <strong style="color:var(--accent);">Dual-Engine (API + Scraper Fallback)</strong>
          </div>
          <div style="background:#14110f;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);font-size:12px;">
            <span style="color:var(--text-faint);display:block;font-size:10px;text-transform:uppercase;">Paralel İndirme</span>
            <strong style="color:var(--text);">3 İş Parçacığı (ThreadPoolExecutor)</strong>
          </div>
        </div>
      </div>
    `;
  }

  function renderYouTubeSimOutput(url, title) {
    simOutputContent.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;animation:fadeIn 0.4s;">
        <div style="display:flex;align-items:center;gap:14px;background:#14110f;padding:14px;border-radius:10px;border:1px solid var(--border);">
          <div style="width:54px;height:54px;background:#1e1916;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">👑</div>
          <div style="flex:1;">
            <h4 style="font-size:15px;font-weight:700;color:var(--text);">${title}</h4>
            <p style="font-size:12px;color:var(--text-dim);margin-top:2px;">Süre: 05:55 · 4K UHD (2160p) + AAC Audio · LRCLIB Lyrics Embedded</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:11px;color:#3fb950;background:rgba(46,160,67,0.15);padding:4px 10px;border-radius:20px;">100% INDIRILDI</span>
        </div>

        <div style="background:#14110f;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);font-family:var(--font-mono);font-size:11px;color:var(--text-dim);line-height:1.5;">
          <span style="color:var(--accent);">[LRCLIB Lyrics Stream]:</span><br>
          [00:00.15] Is this the real life? Is this just fantasy?<br>
          [00:07.13] Caught in a landslide, no escape from reality...
        </div>
      </div>
    `;
  }

  function renderPodcastSimOutput(url, title) {
    simOutputContent.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;animation:fadeIn 0.4s;">
        <div style="display:flex;align-items:center;gap:14px;background:#14110f;padding:14px;border-radius:10px;border:1px solid var(--border);">
          <div style="width:54px;height:54px;background:#1e1916;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">🎙️</div>
          <div style="flex:1;">
            <h4 style="font-size:15px;font-weight:700;color:var(--text);">${title}</h4>
            <p style="font-size:12px;color:var(--text-dim);margin-top:2px;">Süre: 42:10 · SponsorBlock 3 Reklam Segmenti Algılandı & Otomatik Atlandı</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:11px;color:#3b82f6;background:rgba(59,130,246,0.15);padding:4px 10px;border-radius:20px;">SPONSORBLOCK KESILDI</span>
        </div>

        <div style="background:#14110f;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);font-size:12px;">
          <span style="color:var(--text-faint);display:block;font-size:10px;text-transform:uppercase;">Altyazı Durumu</span>
          <strong style="color:#3fb950;">Otomatik Türkçe & İngilizce Altyazılar (.SRT) Videoya Gömüldü</strong>
        </div>
      </div>
    `;
  }
});
