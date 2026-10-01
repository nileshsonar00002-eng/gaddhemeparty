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

  container.innerHTML = `
    <div class="w-full sm:w-auto p-2.5 sm:py-2 sm:px-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-white shadow-xs max-w-full">
      <div class="flex items-center justify-center sm:justify-start gap-4 sm:gap-6">
        
        <!-- Column 1: Total Verified Reports -->
        <div class="flex items-center gap-2 text-left min-w-0">
          <span class="text-xs text-slate-300 font-medium whitespace-nowrap" data-i18n="totalCounter">${t('totalCounter')}</span>
          <span id="stat-total-counter" class="tabular-nums font-bold text-[#F5B301] text-base sm:text-sm tracking-tight">${prevTotal.toLocaleString('en-IN')}</span>
        </div>

        <!-- Divider -->
        <div class="w-px h-4 bg-white/20 shrink-0"></div>

        <!-- Column 2: Reports Logged Today -->
        <div class="flex items-center gap-2 text-left min-w-0">
          <span class="text-xs text-slate-300 font-medium whitespace-nowrap" data-i18n="todayCounter">${t('todayCounter')}</span>
          <span id="stat-today-counter" class="tabular-nums font-bold text-white text-base sm:text-sm tracking-tight">${prevToday.toLocaleString('en-IN')}</span>
        </div>
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
