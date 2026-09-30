import { t } from '../utils/i18n';
import { prefersReducedMotion } from '../utils/deviceTier';
import { getLucideIcon } from '../utils/icons';

let prevTotal = 0;
let prevToday = 0;

function animateNumber(element, start, end, duration = 1000) {
  if (!element) return;
  if (prefersReducedMotion() || start === end) {
    element.textContent = end.toLocaleString('en-IN');
    return;
  }

  const startTime = performance.now();
  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
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
    <div class="px-3.5 py-2 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] flex items-center justify-around sm:justify-start sm:gap-5 text-xs font-normal text-[var(--muted)] transition-colors duration-200 w-full sm:w-auto">
      <!-- Total Verified Reports -->
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-[var(--danger)]"></span>
        <span data-i18n="totalCounter">${t('totalCounter')}:</span>
        <span id="stat-total-counter" class="tabular-nums font-bold text-[var(--text)] text-xs sm:text-sm">${prevTotal.toLocaleString('en-IN')}</span>
      </div>

      <div class="w-px h-3.5 bg-[var(--border)]"></div>

      <!-- Reports Logged Today -->
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
        <span data-i18n="todayCounter">${t('todayCounter')}:</span>
        <span id="stat-today-counter" class="tabular-nums font-bold text-[var(--text)] text-xs sm:text-sm">${prevToday.toLocaleString('en-IN')}</span>
      </div>

      <div class="w-px h-3.5 bg-[var(--border)] hidden xs:block"></div>

      <!-- Top Active City -->
      <div class="hidden xs:flex items-center gap-1.5">
        ${getLucideIcon('navigation', 'w-3.5 h-3.5 text-[var(--muted)]')}
        <span><span data-i18n="topCity">${t('topCity')}</span>:</span>
        <span class="font-medium text-[var(--text)]">${topCity}</span>
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
