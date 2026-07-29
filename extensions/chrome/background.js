const API_BASE = "http://127.0.0.1:8765/api";

// 1. Setup Context Menu Item on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ytdlp-download-media",
    title: "📥 Download with yt-dlp Pro",
    contexts: ["link", "video", "audio", "page"]
  });
});

// 2. Listen to Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ytdlp-download-media") {
    const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;
    if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
      return;
    }

    try {
      await fetch(`${API_BASE}/queue/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          profile: "best",
          settings: {
            mode: "Video"
          }
        })
      });
    } catch (e) {
      console.warn("[yt-dlp Extension] Failed to reach local backend:", e);
    }
  }
});
