const API_BASE = "http://127.0.0.1:8765/api";

document.addEventListener("DOMContentLoaded", async () => {
  const statusDot = document.getElementById("statusDot");
  const activeUrlEl = document.getElementById("activeUrl");
  const modeSelect = document.getElementById("modeSelect");
  const profileSelect = document.getElementById("profileSelect");
  const downloadBtn = document.getElementById("downloadBtn");
  const toastMsg = document.getElementById("toastMsg");

  let currentTabUrl = "";

  // 1. Check connection status with local Desktop App
  async function checkServerStatus() {
    try {
      const res = await fetch(`${API_BASE}/config/system/status`, { method: "GET" });
      if (res.ok) {
        statusDot.classList.add("connected");
        statusDot.title = "Connected to Desktop App";
        return true;
      }
    } catch (e) {
      statusDot.classList.remove("connected");
      statusDot.title = "Desktop App Offline (Launch yt-dlp Pro)";
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
        activeUrlEl.textContent = "Non-media page (chrome:// or local file)";
        downloadBtn.disabled = true;
      }
    }
  } catch (err) {
    activeUrlEl.textContent = "Could not detect active tab URL.";
    downloadBtn.disabled = true;
  }

  // 3. Handle Enqueue Button Click
  downloadBtn.addEventListener("click", async () => {
    if (!currentTabUrl) return;

    downloadBtn.disabled = true;
    downloadBtn.querySelector("span").textContent = "⏳ Adding Task...";

    const mode = modeSelect.value;
    const profile = profileSelect.value;

    try {
      const res = await fetch(`${API_BASE}/queue/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentTabUrl,
          profile: profile,
          settings: {
            mode: mode
          }
        })
      });

      if (res.ok) {
        showToast("✅ Task enqueued to Desktop App!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Error: ${errData.detail || "Failed to add task"}`, "error");
      }
    } catch (err) {
      showToast("❌ Could not connect to Desktop App.", "error");
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.querySelector("span").textContent = "📥 Enqueue to Desktop App";
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
