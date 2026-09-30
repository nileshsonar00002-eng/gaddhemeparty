import { t, getLanguage } from '../utils/i18n';
import { processPotholeImage } from '../utils/imageProcessor';
import { getActionQuota } from '../utils/upvoteStorage';
import { getLucideIcon } from '../utils/icons';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation, getRealDeviceGps, setRealDeviceGps } from '../utils/geo';
import { haversineDistanceKm } from '../utils/cities';

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
  let isLocationConfirmed = options.isLocationConfirmed !== undefined 
    ? options.isLocationConfirmed 
    : (fallbackCoords.accuracy || 50) <= 100;
  let processedImageData = options.imageData || null;
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

        <div id="photo-dropzone" class="relative group ${quota.isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 bg-[var(--surface-2)] transition-all flex flex-col items-center justify-center min-h-[120px] text-center overflow-hidden">
          <div id="photo-placeholder" class="${processedImageData ? 'hidden' : 'flex'} flex-col items-center justify-center gap-1.5">
            <div class="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition">
              ${getLucideIcon('camera', 'w-5 h-5')}
            </div>
            <div class="text-xs font-semibold text-[var(--text)]">
              ${t('takePhoto')}
            </div>
          </div>

          <!-- Live Preview Image -->
          <div id="photo-preview-container" class="${processedImageData ? 'flex' : 'hidden'} w-full relative flex flex-col items-center">
            <img id="photo-preview-img" src="${processedImageData?.previewUrl || ''}" class="w-full max-h-[160px] object-cover rounded-xl border border-[var(--border)] shadow-xs" alt="Pothole preview" />
            <div id="photo-size-badge" class="tabular-nums mt-2 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30 font-medium">
              ${processedImageData ? t('photoOptimized', { size: processedImageData.sizeKb }) : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Location Verification Card (Integrated with Main Map) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-[var(--muted)]">
            ${t('locationStepTitle')} <span class="text-[var(--danger)]">*</span>
          </label>
          <span id="pin-confirm-badge" class="tabular-nums text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            isLocationConfirmed
              ? 'bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          }">
            ${isLocationConfirmed ? t('locationConfirmed') : (isHindi ? 'पुष्टि बाकी' : 'Needs Confirm')}
          </span>
        </div>

        <!-- GPS Status Bar -->
        <div id="gps-status-card" class="bg-[var(--surface-2)] border ${isLocationConfirmed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} rounded-xl p-3 transition-colors duration-200 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <span id="gps-dot-indicator" class="w-2.5 h-2.5 rounded-full ${isLocationConfirmed ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0"></span>
              <div class="min-w-0">
                <div id="gps-status-text" class="text-xs font-semibold truncate ${isLocationConfirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
                  ${isLocationConfirmed ? t('locationConfirmed') : t('gpsLocked')}
                </div>
                <div id="gps-coords-text" class="tabular-nums text-[11px] font-mono text-[var(--muted)] truncate">
                  ${formatCoords(currentCoordinates)} ${(currentCoordinates.accuracy ? `(~${Math.round(currentCoordinates.accuracy)}m)` : '')}
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

          <!-- Adjust / Pin on Main Map CTA Button -->
          <button id="btn-open-map-picker" type="button" class="btn-secondary w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer">
            <svg class="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>${t('adjustLocationBtn')}</span>
          </button>
        </div>

        <!-- Weak GPS Warning Banner (>100m accuracy) -->
        <div id="weak-gps-warning" class="${(currentCoordinates.accuracy || 0) > 100 && !isLocationConfirmed ? 'flex' : 'hidden'} bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-700 dark:text-amber-400 items-start gap-2">
          ${getLucideIcon('alert', 'w-4 h-4 shrink-0 mt-0.5 text-amber-500')}
          <span class="leading-relaxed">${t('weakGpsWarning')}</span>
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
          value="${options.landmark || ''}"
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
        ${quota.isLimitReached || (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100) || !processedImageData ? 'disabled' : ''}
        class="btn-primary w-full mt-2 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <span id="submit-btn-spinner" class="hidden w-4 h-4 border-2 border-[var(--accent-ink)] border-t-transparent rounded-full animate-spin"></span>
        <span id="submit-btn-text">
          ${
            quota.isLimitReached
              ? t('dailyLimitReached')
              : (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100)
              ? (isHindi ? 'पहले मैप पर लोकेशन कन्फर्म करें' : 'Confirm Location on Map First')
              : !processedImageData
              ? t('photoRequiredBtn')
              : t('submitBtn')
          }
        </span>
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
  const openMapPickerBtn = container.querySelector('#btn-open-map-picker');
  const gpsStatusCard = container.querySelector('#gps-status-card');
  const gpsDotIndicator = container.querySelector('#gps-dot-indicator');
  const gpsStatusText = container.querySelector('#gps-status-text');
  const gpsCoordsText = container.querySelector('#gps-coords-text');
  const pinConfirmBadge = container.querySelector('#pin-confirm-badge');
  const weakGpsWarning = container.querySelector('#weak-gps-warning');

  const updateSubmitButtonState = () => {
    if (!submitBtn) return;
    if (quota.isLimitReached) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('dailyLimitReached');
      return;
    }

    if (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = isHindi ? 'पहले मैप पर लोकेशन कन्फर्म करें' : 'Confirm Location on Map First';
      return;
    }

    if (!processedImageData) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('photoRequiredBtn');
      return;
    }

    submitBtn.disabled = false;
    if (submitText) submitText.textContent = t('submitBtn');
  };

  const markLocationConfirmed = (confirmed = true) => {
    isLocationConfirmed = confirmed;

    if (pinConfirmBadge) {
      if (confirmed) {
        pinConfirmBadge.textContent = t('locationConfirmed');
        pinConfirmBadge.className = 'tabular-nums text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30';
      } else {
        pinConfirmBadge.textContent = isHindi ? 'पुष्टि बाकी' : 'Needs Confirm';
        pinConfirmBadge.className = 'tabular-nums text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      }
    }

    if (gpsStatusCard) {
      gpsStatusCard.className = `bg-[var(--surface-2)] border ${confirmed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} rounded-xl p-3 transition-colors duration-200 space-y-2.5`;
    }

    if (gpsDotIndicator) {
      gpsDotIndicator.className = `w-2.5 h-2.5 rounded-full ${confirmed ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0`;
    }

    if (gpsStatusText) {
      gpsStatusText.textContent = confirmed ? t('locationConfirmed') : t('gpsLocked');
      gpsStatusText.className = `text-xs font-semibold truncate ${confirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`;
    }

    if (weakGpsWarning) {
      if (confirmed || (currentCoordinates.accuracy || 0) <= 100) {
        weakGpsWarning.classList.add('hidden');
        weakGpsWarning.classList.remove('flex');
      } else {
        weakGpsWarning.classList.remove('hidden');
        weakGpsWarning.classList.add('flex');
      }
    }

    updateSubmitButtonState();
  };

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
        previewContainer.classList.add('flex');
      }
      updateSubmitButtonState();
    } catch (err) {
      console.error('[ReportForm] Image processing error:', err);
      alert(t('photoError'));
      updateSubmitButtonState();
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
    if (isLive) {
      setRealDeviceGps(coords, coords.source || 'gps');
    }
    setCachedUserLocation(coords, isLive ? 'gps' : 'manual');

    if (gpsCoordsText) {
      gpsCoordsText.textContent = `${formatCoords(coords)} ${coords.accuracy ? `(~${Math.round(coords.accuracy)}m)` : ''}`;
    }
  };

  // Open Map Pin Confirmation Mode on the Main Map
  const startMapPinConfirm = () => {
    if (options.onStartMapPinConfirm) {
      options.onStartMapPinConfirm({
        currentCoordinates,
        imageData: processedImageData,
        landmark: landmarkInput?.value || '',
        onConfirm: (confirmedCoords) => {
          currentCoordinates = { ...confirmedCoords };
          markLocationConfirmed(true);
          updateGpsUI(currentCoordinates, false);
        }
      });
    }
  };

  openMapPickerBtn?.addEventListener('click', () => {
    startMapPinConfirm();
  });

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
        setRealDeviceGps(coords, coords.source || 'gps');
        const accuracy = coords.accuracy || 20;
        if (accuracy > 100) {
          markLocationConfirmed(false);
        } else {
          markLocationConfirmed(true);
        }
        updateGpsUI(coords, coords.source !== 'cache' && coords.source !== 'fallback');
      }
    } catch (err) {
      console.warn('[ReportForm] Live GPS error:', err);
      if (currentCoordinates) {
        updateGpsUI(currentCoordinates, false);
      }
    } finally {
      isGpsAcquiring = false;
    }
  };

  // Only auto-acquire if not passed existing confirmed coordinates
  if (!options.isLocationConfirmed) {
    acquireGps(false);
  }

  // Manual GPS Refresh Button Handler
  refreshGpsBtn?.addEventListener('click', () => {
    acquireGps(true);
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

    // Strict Validation: Image is Mandatory
    if (!processedImageData) {
      if (dropzone) {
        dropzone.classList.add('ring-2', 'ring-rose-500', 'border-rose-500');
        dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          dropzone.classList.remove('ring-2', 'ring-rose-500', 'border-rose-500');
        }, 2500);
      }
      alert(t('photoRequiredAlert'));
      updateSubmitButtonState();
      return;
    }

    // Strict Validation: Location must be confirmed if weak
    if (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100) {
      alert(isHindi ? 'कृपया पहले मैप पर सही स्थान चुनें।' : 'Please confirm location on map first.');
      startMapPinConfirm();
      return;
    }

    // Strict Validation: Max 50km from user's origin GPS location
    const realGps = getRealDeviceGps() || options.baseGps;
    if (realGps && typeof realGps.lat === 'number' && typeof realGps.lng === 'number') {
      const distKm = haversineDistanceKm(realGps.lat, realGps.lng, currentCoordinates.lat, currentCoordinates.lng);
      if (distKm > 50) {
        alert(t('maxRadiusExceededAlert'));
        startMapPinConfirm();
        return;
      }
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
