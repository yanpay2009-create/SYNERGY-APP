export const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn(`LocalStorage quota exceeded for key: ${key}. Clearing some cache...`);
      // Clear some large cached items to make room
      const keysToClear = [
        'synergy_cached_orders',
        'synergy_cached_commissions',
        'synergy_cached_notifications',
        'synergy_cached_feed',
        'synergy_cached_products',
        'synergy_cached_campaignAssets',
        'synergy_cached_onboardingSlides'
      ];
      keysToClear.forEach(k => {
        if (k !== key) localStorage.removeItem(k);
      });
      // Try setting it again after clearing
      try {
        localStorage.setItem(key, value);
      } catch (e2) {
        // If still failing, just don't save it
        console.error(`Failed to setItem even after clearing cache: ${key}`, e2);
      }
    } else {
      console.error(`Error setting localStorage item: ${key}`, e);
    }
  }
};
