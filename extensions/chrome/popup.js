const API_BASE = "http://127.0.0.1:8765/api";

document.addEventListener("DOMContentLoaded", async () => {
  const statusDot = document.getElementById("statusDot");
  const activeUrlEl = document.getElementById("activeUrl");
  const modeSelect = document.getElementById("modeSelect");
  const profileSelect = document.getElementById("profileSelect");
  const downloadBtn = document.getElementById("downloadBtn");
  const syncCookiesBtn = document.getElementById("syncCookiesBtn");
  const toastMsg = document.getElementById("toastMsg");

  let currentTabUrl = "";

  // 1. Check connection status with local Desktop App
  async function checkServerStatus() {
    try {
      const res = await fetch(`${API_BASE}/extension/ping`, { method: "GET" });
      if (res.ok) {
        statusDot.classList.add("connected");
        statusDot.title = "Makara Pro Masaüstü Uygulaması Bağlı";
        return true;
      }
    } catch (e) {
      statusDot.classList.remove("connected");
      statusDot.title = "Masaüstü Uygulaması Çevrimdışı (Makara Pro'yu Başlatın)";
    }
    return false;
  }

  const isConnected = await checkServerStatus();

  // 2. Query active browser tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentTabUrl = tab.url;
      activeUrlEl.textContent = currentTabUrl;
      
      if (currentTabUrl.startsWith("http://") || currentTabUrl.startsWith("https://")) {
        downloadBtn.disabled = !isConnected;
      } else {
        activeUrlEl.textContent = "Medya sayfası değil (chrome:// veya yerel dosya)";
        downloadBtn.disabled = true;
      }
    }
  } catch (err) {
    activeUrlEl.textContent = "Aktif sekme URL'si alınamadı.";
    downloadBtn.disabled = true;
  }

  // 3. Handle Enqueue Button Click
  downloadBtn.addEventListener("click", async () => {
    if (!currentTabUrl) return;

    downloadBtn.disabled = true;
    downloadBtn.querySelector("span").textContent = "⏳ Kuyruğa Ekleniyor...";

    const modeValue = modeSelect.value;
    const profile = profileSelect.value;

    const settings = {
      mode: modeValue === "Audio" ? "Audio" : "Video"
    };

    if (modeValue === "Shorts") {
      settings.auto_shorts = true;
      settings.crop_vertical = true;
    }

    try {
      const res = await fetch(`${API_BASE}/extension/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentTabUrl,
          profile: profile,
          settings: settings
        })
      });

      if (res.ok) {
        showToast("✅ Görev Masaüstü Uygulamasına Eklendi!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Hata: ${errData.detail || "Görev eklenemedi"}`, "error");
      }
    } catch (err) {
      showToast("❌ Masaüstü uygulamasına bağlanılamadı.", "error");
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.querySelector("span").textContent = "⚡ Makara Pro'ya Gönder";
    }
  });

  // 4. Handle Cookie Sync Button Click
  syncCookiesBtn.addEventListener("click", async () => {
    syncCookiesBtn.disabled = true;
    syncCookiesBtn.querySelector("span").textContent = "⏳ Çerezler Çekiliyor...";

    try {
      const res = await chrome.runtime.sendMessage({ action: "sync_cookies" });
      if (res && res.success) {
        showToast(`✅ ${res.count || 0} Çerez Başarıyla Senkronize Edildi!`, "success");
      } else {
        showToast(`❌ Çerez Senkronizasyonu Hata: ${res?.detail || "Başarısız"}`, "error");
      }
    } catch (err) {
      showToast("❌ Çerez senkronizasyonu başarısız.", "error");
    } finally {
      syncCookiesBtn.disabled = false;
      syncCookiesBtn.querySelector("span").textContent = "🍪 Çerezleri Senkronize Et (Bypass Auth)";
    }
  });

  function showToast(text, type) {
    toastMsg.textContent = text;
    toastMsg.className = `toast ${type}`;
    setTimeout(() => {
      toastMsg.className = "toast";
    }, 4000);
  }
});
