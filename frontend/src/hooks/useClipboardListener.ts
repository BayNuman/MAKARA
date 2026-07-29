import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

// Strict regex whitelist for supported media platforms
const MEDIA_URL_REGEX = /https?:\/\/(www\.)?(youtube\.com|youtu\.be|open\.spotify\.com|tiktok\.com|vimeo\.com|twitter\.com|x\.com|instagram\.com|soundcloud\.com|dailymotion\.com)\/[^\s]+/i;

export const useClipboardListener = (onUrlDetected?: (url: string) => void) => {
  const { preferences, lastCopiedUrl, setLastCopiedUrl, addToast } = useAppStore();

  useEffect(() => {
    // Early exit if user disabled clipboard listener in preferences
    if (preferences && preferences.enable_clipboard_listener === false) {
      return;
    }

    const checkClipboard = async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          return;
        }

        const text = await navigator.clipboard.readText();
        if (!text) return;

        const trimmed = text.trim();
        if (!trimmed || trimmed === lastCopiedUrl) {
          return;
        }

        // Validate strictly against supported media platforms
        const match = trimmed.match(MEDIA_URL_REGEX);
        if (match) {
          const detectedUrl = match[0];
          if (detectedUrl !== lastCopiedUrl) {
            setLastCopiedUrl(detectedUrl);
            const lang = preferences?.current_lang || 'tr';
            const msg = lang === 'tr' 
              ? `📋 Pano Adresi Algılandı: ${detectedUrl.substring(0, 45)}...`
              : `📋 Media Link Detected: ${detectedUrl.substring(0, 45)}...`;
            
            addToast(msg, 'info');

            if (onUrlDetected) {
              onUrlDetected(detectedUrl);
            }
          }
        }
      } catch (err) {
        // Silently ignore clipboard permission errors or browser focus blocks
      }
    };

    // Check clipboard when application window gains focus
    const handleFocus = () => {
      checkClipboard();
    };

    window.addEventListener('focus', handleFocus);
    
    // Low-overhead periodic check every 3 seconds
    const intervalId = setInterval(checkClipboard, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [preferences?.enable_clipboard_listener, preferences?.current_lang, lastCopiedUrl]);
};
