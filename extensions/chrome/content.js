// Content Script for Makara Pro Extension - YouTube Injected Actions

function injectMakaraButtons() {
  // Only inject on watch pages
  if (!window.location.pathname.includes('/watch')) {
    return;
  }

  // Prevent duplicate injection
  if (document.getElementById('makara-injected-container')) {
    return;
  }

  // Find target container in YouTube UI (try multiple selector fallbacks for robustness)
  const targetHost = 
    document.querySelector('#top-level-buttons-computed') || 
    document.querySelector('#actions-inner') || 
    document.querySelector('#owner #subscribe-button') ||
    document.querySelector('#above-the-fold #top-row');

  if (!targetHost) {
    // Retry after a short delay if YouTube UI is still rendering
    setTimeout(injectMakaraButtons, 1000);
    return;
  }

  const container = document.createElement('div');
  container.id = 'makara-injected-container';
  container.className = 'makara-btn-container';

  // 1. Download Button
  const dlBtn = document.createElement('button');
  dlBtn.className = 'makara-inject-btn';
  dlBtn.innerHTML = '<span class="makara-btn-icon">⚡</span><span>Makara Pro İndir</span>';
  dlBtn.title = 'Videoyu Makara Pro Masaüstü Uygulaması ile İndir';
  
  dlBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const origText = dlBtn.innerHTML;
    dlBtn.innerHTML = '<span class="makara-btn-icon">⏳</span><span>Ekleniyor...</span>';
    dlBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'enqueue_download',
        url: window.location.href,
        settings: { mode: 'Video' }
      });

      if (response && response.success) {
        dlBtn.className = 'makara-inject-btn success';
        dlBtn.innerHTML = '<span class="makara-btn-icon">✓</span><span>Kuyruğa Eklendi!</span>';
      } else {
        dlBtn.className = 'makara-inject-btn error';
        dlBtn.innerHTML = `<span class="makara-btn-icon">✕</span><span>${response?.detail || 'Hata Oluştu'}</span>`;
      }
    } catch (err) {
      dlBtn.className = 'makara-inject-btn error';
      dlBtn.innerHTML = '<span class="makara-btn-icon">✕</span><span>Uygulama Kapalı</span>';
    } finally {
      setTimeout(() => {
        dlBtn.className = 'makara-inject-btn';
        dlBtn.innerHTML = origText;
        dlBtn.disabled = false;
      }, 3000);
    }
  });

  // 2. Heatmap Shorts 9:16 Button
  const shortsBtn = document.createElement('button');
  shortsBtn.className = 'makara-inject-btn shorts-btn';
  shortsBtn.innerHTML = '<span class="makara-btn-icon">📱</span><span>Shorts Yap (9:16)</span>';
  shortsBtn.title = 'YouTube Heatmap Verisine Göre En Çok İzlenen Anı 9:16 Dikey Kırp';

  shortsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const origText = shortsBtn.innerHTML;
    shortsBtn.innerHTML = '<span class="makara-btn-icon">⏳</span><span>Analiz Ediliyor...</span>';
    shortsBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'enqueue_download',
        url: window.location.href,
        settings: {
          mode: 'Video',
          auto_shorts: true,
          crop_vertical: true
        }
      });

      if (response && response.success) {
        shortsBtn.className = 'makara-inject-btn shorts-btn success';
        shortsBtn.innerHTML = '<span class="makara-btn-icon">✓</span><span>Shorts Kuyrukta!</span>';
      } else {
        shortsBtn.className = 'makara-inject-btn shorts-btn error';
        shortsBtn.innerHTML = `<span class="makara-btn-icon">✕</span><span>${response?.detail || 'Hata'}</span>`;
      }
    } catch (err) {
      shortsBtn.className = 'makara-inject-btn shorts-btn error';
      shortsBtn.innerHTML = '<span class="makara-btn-icon">✕</span><span>Uygulama Kapalı</span>';
    } finally {
      setTimeout(() => {
        shortsBtn.className = 'makara-inject-btn shorts-btn';
        shortsBtn.innerHTML = origText;
        shortsBtn.disabled = false;
      }, 3000);
    }
  });

  container.appendChild(dlBtn);
  container.appendChild(shortsBtn);
  targetHost.appendChild(container);
}

// Initial Injection
injectMakaraButtons();

// Listen to YouTube SPA navigation finish events
document.addEventListener('yt-navigate-finish', () => {
  const existing = document.getElementById('makara-injected-container');
  if (existing) {
    existing.remove();
  }
  setTimeout(injectMakaraButtons, 800);
});

// Periodic fallback check in case of slow DOM loading
setInterval(() => {
  if (window.location.pathname.includes('/watch') && !document.getElementById('makara-injected-container')) {
    injectMakaraButtons();
  }
}, 3000);
