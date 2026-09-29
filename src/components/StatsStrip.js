import { t } from '../utils/i18n';
import { prefersReducedMotion } from '../utils/deviceTier';

let prevTotal = 0;
let prevToday = 0;

function animateNumber(element, start, end, duration = 1200) {
  if (!element) return;
  if (prefersReducedMotion() || start === end) {
    element.textContent = end.toLocaleString('en-IN');
    return;
  }

  const startTime = performance.now();
  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out expo
    const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentVal = Math.round(start + (end - start) * easeOut);
    element.textContent = currentVal.toLocaleString('en-IN');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = end.toLocaleString('en-IN');
    }
  };
  requestAnimationFrame(step);
}

export function renderStatsStrip(container, statsData = {}) {
  if (!container) return;

  const total = statsData.totalReports || 0;
  const today = statsData.todayReports || 0;
  const topCity = statsData.topCity || 'दिल्ली / मुंबई';

  container.innerHTML = `
    <div class="px-4 py-2.5 bg-[var(--bg-card)] backdrop-blur-md rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-around sm:justify-start sm:gap-6 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 w-full sm:w-auto">
      <!-- Total Verified Reports -->
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
        <span class="text-[var(--text-muted)] font-sans" data-i18n="totalCounter">${t('totalCounter')}:</span>
        <span id="stat-total-counter" class="font-heading font-black text-[var(--accent-amber-text)] text-sm sm:text-base tracking-wide">${prevTotal.toLocaleString('en-IN')}</span>
      </div>

      <div class="w-px h-4 bg-[var(--border-color)]"></div>

      <!-- Reports Logged Today -->
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
        <span class="text-[var(--text-muted)] font-sans" data-i18n="todayCounter">${t('todayCounter')}:</span>
        <span id="stat-today-counter" class="font-heading font-black text-[var(--text-primary)] text-sm sm:text-base tracking-wide">${prevToday.toLocaleString('en-IN')}</span>
      </div>

      <div class="w-px h-4 bg-[var(--border-color)] hidden xs:block"></div>

      <!-- Top Active City -->
      <div class="hidden xs:flex items-center gap-2">
        <span class="text-[var(--text-muted)] font-sans">📍 <span data-i18n="topCity">${t('topCity')}</span>:</span>
        <span class="font-bold text-[var(--accent-amber-text)]">${topCity}</span>
      </div>
    </div>
  `;

  const totalEl = container.querySelector('#stat-total-counter');
  const todayEl = container.querySelector('#stat-today-counter');

  animateNumber(totalEl, prevTotal, total);
  animateNumber(todayEl, prevToday, today);

  prevTotal = total;
  prevToday = today;
}

