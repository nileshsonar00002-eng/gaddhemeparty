import { getLanguage } from '../utils/i18n';
import { subscribeToGlobalStats, recordVisitorSession } from '../services/firebase';

/**
 * Visitors Counter Component
 * Displays a clean, dark-themed, functional visitors counter without any background box.
 * Placed centered right above the car & bike bottom animation strip.
 */
export function initVisitorsCounter(mountId = 'visitors-counter-mount') {
  const container = document.getElementById(mountId);
  if (!container) return;

  // Record unique visitor session atomically in Firestore
  recordVisitorSession();

  // Local storage fallback calculation
  const LOCAL_STORAGE_KEY = 'khadda_base_visitors';
  let cachedCount = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) || '1248', 10);
  if (isNaN(cachedCount) || cachedCount < 1248) {
    cachedCount = 1248;
  }

  const render = (countNum) => {
    const isHindi = getLanguage() === 'hindi';
    const label = isHindi ? 'कुल विजिटर्स' : 'TOTAL VISITORS';
    const formattedCount = Number(countNum).toLocaleString(isHindi ? 'hi-IN' : 'en-US');

    // Clean dark color theme text, NO background box, NO emoji, CAPITAL text
    container.innerHTML = `
      <div class="w-full py-3 px-4 text-center select-none bg-transparent">
        <p class="inline-flex items-center justify-center gap-2 text-sm sm:text-base font-heading font-black text-[#2B100C] dark:text-[#F9F2E8] tracking-wider uppercase">
          <span>${label}:</span>
          <span class="font-mono font-black text-amber-700 dark:text-amber-400 tabular-nums">${formattedCount}</span>
        </p>
      </div>
    `;
  };

  // Render initial count
  render(cachedCount);

  // Subscribe to real-time Firestore stats listener
  subscribeToGlobalStats((statsData) => {
    if (statsData) {
      let count = 0;
      if (typeof statsData.visitorCount === 'number') {
        count = statsData.visitorCount;
      } else if (typeof statsData.visitors === 'number') {
        count = statsData.visitors;
      }
      
      const liveCount = Math.max(cachedCount, count + 1248);
      localStorage.setItem(LOCAL_STORAGE_KEY, String(liveCount));
      render(liveCount);
    }
  });
}
