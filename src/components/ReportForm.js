import { t, getLanguage } from '../utils/i18n';
import { processPotholeImage } from '../utils/imageProcessor';
import { getActionQuota } from '../utils/upvoteStorage';
import { getLucideIcon } from '../utils/icons';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation } from '../utils/geo';
import { INDIAN_CITIES } from '../utils/cities';

export function renderReportForm(container, options = {}) {
  const formOpenTime = Date.now();
  const isHindi = getLanguage() === 'hindi';

  // Guaranteed fallback coordinates: options -> cached -> map center -> default Pune/Pimpri
  const fallbackCoords = options.currentCoordinates ||
    getCachedUserLocation() ||
    options.mapCenter ||
    { lat: 18.6298, lng: 73.7997, accuracy: 50 };

  let currentCoordinates = { ...fallbackCoords };
  let isGpsAcquiring = false;
  let processedImageData = null;
  let locationSource = currentCoordinates.source || (currentCoordinates.accuracy <= 25 ? 'gps' : 'map');
  const quota = getActionQuota();

  const formatCoords = (coords) => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return '18.62980, 73.79970';
    return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
  };

  container.innerHTML = `
    <div class="space-y-4 text-[var(--text)]">
      <!-- Title & Subtitle with Quota Badge -->
      <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-heading font-bold text-lg text-[var(--text)]">
              ${t('sheetTitle')}
            </h2>
            <span class="tabular-nums text-[10px] font-medium px-2 py-0.5 rounded-full ${
              quota.isLimitReached
                ? 'bg-rose-500/15 text-[var(--danger)] border border-rose-500/30'
                : 'bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30'
            }">
              ${t('reportsRemainingBadge', { count: quota.remaining })}
            </span>
          </div>
          <p class="text-xs text-[var(--muted)] mt-0.5">${t('sheetSubtitle')}</p>
        </div>
      </div>

      ${
        quota.isLimitReached
          ? `
        <!-- Limit Reached Notice Banner -->
        <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[var(--danger)]">
          ${getLucideIcon('alert', 'w-4 h-4 shrink-0 mt-0.5')}
          <div>
            <div class="font-bold">${t('dailyLimitReached')}</div>
            <div class="text-[11px] opacity-85 mt-0.5">
              ${t('nextReportAvailable', { time: quota.waitFormatted || 'कुछ समय' })}
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Photo Upload Dropzone -->
      <div>
        <label class="block text-xs font-semibold text-[var(--muted)] mb-1.5">
          ${t('tapToPhoto')} <span class="text-[var(--danger)]">*</span>
        </label>
        
        <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" ${quota.isLimitReached ? 'disabled' : ''} />

        <div id="photo-dropzone" class="relative group ${quota.isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 bg-[var(--surface-2)] transition-all flex flex-col items-center justify-center min-h-[130px] text-center overflow-hidden">
          <div id="photo-placeholder" class="flex flex-col items-center justify-center gap-1.5">
            <div class="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition">
              ${getLucideIcon('camera', 'w-5 h-5')}
            </div>
            <div class="text-xs font-semibold text-[var(--text)]">
              ${t('takePhoto')}
            </div>
            <p class="text-[11px] text-[var(--muted)]">${t('photoOptNote')}</p>
          </div>

          <!-- Live Preview Image -->
          <div id="photo-preview-container" class="hidden w-full relative flex flex-col items-center">
            <img id="photo-preview-img" class="w-full max-h-[160px] object-cover rounded-xl border border-[var(--border)] shadow-xs" alt="Pothole preview" />
            <div id="photo-size-badge" class="tabular-nums mt-2 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30 font-medium"></div>
          </div>
        </div>
      </div>

      <!-- GPS & Location Status Box (Auto-Locking with Map Fallback) -->
      <div id="gps-status-card" class="bg-[var(--surface-2)] border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 transition-colors duration-200 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <span id="gps-dot-indicator" class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <div class="min-w-0">
              <div id="gps-status-text" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                ${t('gpsLocked')}
              </div>
              <div id="gps-coords-text" class="tabular-nums text-[11px] font-mono text-[var(--muted)] truncate">
                ${formatCoords(currentCoordinates)}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button id="btn-refresh-gps" type="button" class="btn-secondary px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1 cursor-pointer" title="${t('gpsRetry')}" aria-label="${t('gpsRetry')}">
              ${getLucideIcon('refresh', 'w-3.5 h-3.5')}
              <span class="text-[11px] font-medium hidden sm:inline">GPS</span>
            </button>
          </div>
        </div>

        <!-- Location Controls: Quick Map Location or City Selector -->
        <div class="pt-1.5 border-t border-[var(--border)] flex items-center gap-2 text-xs flex-wrap">
          <button id="btn-use-map-center" type="button" class="text-[11px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer">
            ${getLucideIcon('map', 'w-3 h-3')}
            <span>${isHindi ? 'मैप की वर्तमान लोकेशन लें' : 'Use Current Map Center'}</span>
          </button>

          <span class="text-[var(--muted)]">•</span>

          <!-- Quick City Dropdown -->
          <div class="relative inline-block">
            <select id="select-quick-city" class="text-[11px] font-medium bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-md px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option value="">${isHindi ? '📍 शहर चुनें...' : '📍 Select City...'}</option>
              ${INDIAN_CITIES.slice(0, 15).map(c => `
                <option value="${c.lat},${c.lng}">${isHindi ? c.nameHindi : c.nameEnglish}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Landmark & Description Input -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="landmark-input" class="text-xs font-semibold text-[var(--muted)]">
            ${t('landmarkLabel')}
          </label>
          <span id="char-counter" class="tabular-nums text-[10px] font-mono text-[var(--muted)]">0/100</span>
        </div>
        <input
          type="text"
          id="landmark-input"
          maxlength="100"
          placeholder="${t('landmarkPlaceholder')}"
          ${quota.isLimitReached ? 'disabled' : ''}
          class="w-full px-3.5 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-transparent transition disabled:opacity-50"
        />
      </div>

      <!-- Anti-Spam Hidden Honeypot Field -->
      <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;">
        <label for="website_hp">Leave this empty</label>
        <input type="text" id="website_hp" name="website_hp" tabindex="-1" autocomplete="off" />
      </div>

      <!-- Submit Button -->
      <button
        id="btn-submit-report"
        type="button"
        ${quota.isLimitReached ? 'disabled' : ''}
        class="btn-primary w-full mt-2 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span id="submit-btn-spinner" class="hidden w-4 h-4 border-2 border-[var(--accent-ink)] border-t-transparent rounded-full animate-spin"></span>
        <span id="submit-btn-text">${quota.isLimitReached ? t('dailyLimitReached') : t('submitBtn')}</span>
      </button>
    </div>
  `;

  // Attach DOM Listeners
  const fileInput = container.querySelector('#photo-input');
  const dropzone = container.querySelector('#photo-dropzone');
  const photoPlaceholder = container.querySelector('#photo-placeholder');
  const previewContainer = container.querySelector('#photo-preview-container');
  const previewImg = container.querySelector('#photo-preview-img');
  const sizeBadge = container.querySelector('#photo-size-badge');
  const landmarkInput = container.querySelector('#landmark-input');
  const charCounter = container.querySelector('#char-counter');
  const submitBtn = container.querySelector('#btn-submit-report');
  const submitSpinner = container.querySelector('#submit-btn-spinner');
  const submitText = container.querySelector('#submit-btn-text');
  const refreshGpsBtn = container.querySelector('#btn-refresh-gps');
  const useMapCenterBtn = container.querySelector('#btn-use-map-center');
  const citySelect = container.querySelector('#select-quick-city');
  const gpsStatusCard = container.querySelector('#gps-status-card');
  const gpsDotIndicator = container.querySelector('#gps-dot-indicator');
  const gpsStatusText = container.querySelector('#gps-status-text');
  const gpsCoordsText = container.querySelector('#gps-coords-text');

  // Trigger file selection on dropzone click
  dropzone?.addEventListener('click', () => {
    if (!quota.isLimitReached) {
      fileInput?.click();
    }
  });

  // Handle Photo selection & compression
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      photoPlaceholder?.classList.add('opacity-50');
      const processed = await processPotholeImage(file);
      processedImageData = processed;

      if (previewImg && previewContainer && sizeBadge && photoPlaceholder) {
        previewImg.src = processed.previewUrl;
        sizeBadge.textContent = t('photoOptimized', { size: processed.sizeKb });
        photoPlaceholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      }
    } catch (err) {
      console.error('[ReportForm] Image processing error:', err);
      alert(t('photoError'));
    }
  });

  // Character Counter
  landmarkInput?.addEventListener('input', (e) => {
    const length = e.target.value.length;
    if (charCounter) charCounter.textContent = `${length}/100`;
  });

  const updateGpsUI = (coords, isLive = true) => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
    currentCoordinates = coords;
    setCachedUserLocation(coords, isLive ? 'gps' : 'manual');

    if (gpsStatusCard) {
      gpsStatusCard.className = 'bg-[var(--surface-2)] border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 transition-colors duration-200 space-y-2';
    }
    if (gpsDotIndicator) {
      gpsDotIndicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0';
    }
    if (gpsStatusText) {
      gpsStatusText.textContent = isLive ? t('gpsLocked') : (isHindi ? 'लोकेशन सेट ✓' : 'Location Set ✓');
      gpsStatusText.className = 'text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate';
    }
    if (gpsCoordsText) {
      gpsCoordsText.textContent = formatCoords(coords);
    }
  };

  // Function to acquire and update GPS state smoothly
  const acquireGps = async (forceRefresh = false) => {
    if (isGpsAcquiring) return;
    isGpsAcquiring = true;

    if (forceRefresh) {
      if (gpsStatusText) {
        gpsStatusText.textContent = t('gpsSearching');
        gpsStatusText.className = 'text-xs font-semibold text-[var(--text)] truncate';
      }
      if (gpsDotIndicator) {
        gpsDotIndicator.className = 'w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping shrink-0';
      }
    }

    try {
      const coords = await getLiveUserLocation({
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: forceRefresh ? 0 : 30000,
        fallbackToCache: true
      });

      if (coords && coords.lat && coords.lng) {
        updateGpsUI(coords, coords.source !== 'cache' && coords.source !== 'fallback');
      }
    } catch (err) {
      console.warn('[ReportForm] Live GPS error:', err);
      // Even if live GPS throws, fallback to existing coordinates smoothly
      if (currentCoordinates) {
        updateGpsUI(currentCoordinates, false);
      }
    } finally {
      isGpsAcquiring = false;
    }
  };

  // Automatically acquire fresh GPS immediately on mount
  acquireGps(false);

  // Manual GPS Refresh Button Handler
  refreshGpsBtn?.addEventListener('click', () => {
    acquireGps(true);
  });

  // Use Map Center Handler
  useMapCenterBtn?.addEventListener('click', () => {
    if (options.getMapCenter) {
      const center = options.getMapCenter();
      if (center && center.lat && center.lng) {
        updateGpsUI(center, false);
        return;
      }
    }
    if (options.mapCenter) {
      updateGpsUI(options.mapCenter, false);
    }
  });

  // City Selection Handler
  citySelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const [lat, lng] = val.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        updateGpsUI({ lat, lng, accuracy: 250, source: 'city_select' }, false);
      }
    }
  });

  // Submit Handler
  submitBtn?.addEventListener('click', async () => {
    const honeypotVal = container.querySelector('#website_hp')?.value;
    if (honeypotVal) {
      console.warn('Bot submission blocked');
      return;
    }

    const timeToSubmit = Date.now() - formOpenTime;
    if (timeToSubmit < 800) {
      console.warn('Submission too fast');
      return;
    }

    // Coordinates are always guaranteed (fallback to map center or default if needed)
    if (!currentCoordinates || typeof currentCoordinates.lat !== 'number' || typeof currentCoordinates.lng !== 'number') {
      currentCoordinates = fallbackCoords;
    }

    const landmark = landmarkInput?.value?.trim() || t('defaultLandmark');

    // UI Loading state
    submitBtn.disabled = true;
    submitSpinner?.classList.remove('hidden');
    if (submitText) submitText.textContent = t('submitting');

    try {
      if (options.onSubmit) {
        await options.onSubmit({
          latitude: currentCoordinates.lat,
          longitude: currentCoordinates.lng,
          coordinates: currentCoordinates,
          landmark,
          imageData: processedImageData,
          formOpenTime,
          website_hp: honeypotVal
        });
      }
    } catch (err) {
      console.error('[ReportForm] Submission error:', err);
      alert(t('submitError'));
      submitBtn.disabled = false;
      submitSpinner?.classList.add('hidden');
      if (submitText) submitText.textContent = t('submitBtn');
    }
  });
}
