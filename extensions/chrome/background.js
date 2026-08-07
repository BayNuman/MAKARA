const API_BASE = "http://127.0.0.1:8765/api";

function convertCookiesToNetscapeFormat(cookies) {
  let output = "# Netscape HTTP Cookie File\n";
  output += "# http://curl.haxx.se/rfc/cookie_spec.html\n";
  output += "# This is a generated file! Do not edit.\n\n";

  for (const c of cookies) {
    let domain = c.domain || "";
    let name = c.name || "";
    
    // RFC 6265 / Netscape rules for __Host- cookies and hostOnly cookies:
    // Host-only cookies must not start with a leading dot.
    const isHostOnly = c.hostOnly || name.startsWith("__Host-");
    let includeSubdomains = "FALSE";
    
    if (isHostOnly) {
      if (domain.startsWith(".")) {
        domain = domain.substring(1);
      }
      includeSubdomains = "FALSE";
    } else {
      if (!domain.startsWith(".")) {
        domain = "." + domain;
      }
      includeSubdomains = "TRUE";
    }

    const path = c.path || "/";
    const secure = c.secure ? "TRUE" : "FALSE";
    const expiration = c.expirationDate ? Math.round(c.expirationDate) : 0;
    const value = c.value || "";

    output += `${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expiration}\t${name}\t${value}\n`;
  }
  return output;
}

// Function to extract cookies for target domains and sync to Desktop Backend
async function syncCookiesToBackend(domains = [".youtube.com", "youtube.com", ".spotify.com", ".instagram.com"]) {
  try {
    let allCookies = [];
    for (const domain of domains) {
      try {
        const cookies = await chrome.cookies.getAll({ domain });
        if (cookies && cookies.length > 0) {
          allCookies.push(...cookies);
        }
      } catch (err) {
        console.warn(`[Makara Extension] Could not fetch cookies for ${domain}:`, err);
      }
    }

    if (allCookies.length === 0) {
      return { success: false, detail: "No cookies found for target domains." };
    }

    const cookiesTxt = convertCookiesToNetscapeFormat(allCookies);

    const res = await fetch(`${API_BASE}/extension/sync-cookies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookies_txt: cookiesTxt })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, count: allCookies.length, detail: data.detail };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, detail: errData.detail || "Server error syncing cookies." };
    }
  } catch (err) {
    console.error("[Makara Extension] Cookie sync failed:", err);
    return { success: false, detail: "Could not connect to Makara Pro desktop app." };
  }
}

// 1. Setup Context Menu Items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ytdlp-download-media",
    title: "⚡ Download with Makara Pro",
    contexts: ["link", "video", "audio", "page"]
  });
  chrome.contextMenus.create({
    id: "ytdlp-sync-cookies",
    title: "🍪 Sync Cookies to Makara Pro (Bypass Auth)",
    contexts: ["all"]
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
      await fetch(`${API_BASE}/extension/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          profile: "best",
          settings: { mode: "Video" }
        })
      });
    } catch (e) {
      console.warn("[Makara Extension] Failed to reach local backend:", e);
    }
  } else if (info.menuItemId === "ytdlp-sync-cookies") {
    await syncCookiesToBackend();
  }
});

// 3. Listen to Internal Extension Messages (from content.js & popup.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enqueue_download") {
    fetch(`${API_BASE}/extension/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: request.url,
        profile: request.profile || "best",
        settings: request.settings || { mode: "Video" }
      })
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          // Auto-sync cookies on successful download trigger for seamless session state
          syncCookiesToBackend().catch(() => {});
          sendResponse({ success: true, detail: data.detail });
        } else {
          const errData = await res.json().catch(() => ({}));
          sendResponse({ success: false, detail: errData.detail || "Failed to enqueue task" });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, detail: "Makara Pro desktop app offline" });
      });
    return true; // Keep message channel open for async response
  } else if (request.action === "sync_cookies") {
    syncCookiesToBackend()
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, detail: String(err) }));
    return true;
  }
});
