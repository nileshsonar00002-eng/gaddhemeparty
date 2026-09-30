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
    <div class="w-full sm:w-auto p-2.5 sm:py-2 sm:px-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-white shadow-xs max-w-full">
      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-6">
        
        <!-- Column 1: Total Verified Reports -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-center sm:text-left bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/10 sm:border-0 min-w-0">
          <span class="text-[10px] sm:text-xs text-slate-300 font-medium whitespace-nowrap truncate" data-i18n="totalCounter">${t('totalCounter')}</span>
          <span id="stat-total-counter" class="tabular-nums font-bold text-[#F5B301] text-base sm:text-sm tracking-tight">${prevTotal.toLocaleString('en-IN')}</span>
        </div>

        <!-- Desktop Divider -->
        <div class="hidden sm:block w-px h-4 bg-white/20 shrink-0"></div>

        <!-- Column 2: Reports Logged Today -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-center sm:text-left bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/10 sm:border-0 min-w-0">
          <span class="text-[10px] sm:text-xs text-slate-300 font-medium whitespace-nowrap truncate" data-i18n="todayCounter">${t('todayCounter')}</span>
          <span id="stat-today-counter" class="tabular-nums font-bold text-white text-base sm:text-sm tracking-tight">${prevToday.toLocaleString('en-IN')}</span>
        </div>

        <!-- Desktop Divider -->
        <div class="hidden sm:block w-px h-4 bg-white/20 shrink-0"></div>

        <!-- Top Active City: Row on Desktop, Clean subtle bar on mobile -->
        <div class="col-span-2 sm:col-span-1 pt-0.5 sm:pt-0 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-300 min-w-0">
          ${getLucideIcon('navigation', 'w-3 h-3 text-slate-400 shrink-0')}
          <span class="text-slate-300 text-[10px] sm:text-xs shrink-0"><span data-i18n="topCity">${t('topCity')}</span>:</span>
          <span class="font-semibold text-white text-[10px] sm:text-xs truncate">${topCity}</span>
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
