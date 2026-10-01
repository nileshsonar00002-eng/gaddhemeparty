import { t, getLanguage } from '../utils/i18n';
import { processPotholeImage } from '../utils/imageProcessor';
import { getActionQuota } from '../utils/upvoteStorage';
import { getLucideIcon } from '../utils/icons';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation, getRealDeviceGps, setRealDeviceGps } from '../utils/geo';
import { haversineDistanceKm } from '../utils/cities';

export function renderReportForm(container, options = {}) {
  const formOpenTime = Date.now();
  const isHindi = getLanguage() === 'hindi';

  // Fallback coordinates: passed options -> cached -> map center -> default Pune/Pimpri
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

  // Helper to get unified GPS status based on accuracy & confirmation
  const getGpsStatusData = (coords, confirmed) => {
    const acc = Math.round(coords?.accuracy || 50);
    if (confirmed) {
      return {
        level: 'green',
        dotClass: 'bg-emerald-500',
        cardClass: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        statusText: t('gpsVerifiedPin'),
        accText: `±${acc}m`
      };
    }
    if (acc <= 25) {
      return {
        level: 'green',
        dotClass: 'bg-emerald-500',
        cardClass: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        statusText: t('gpsAccurateStatus', { acc }),
        accText: `±${acc}m`
      };
    }
    if (acc <= 100) {
      return {
        level: 'amber',
        dotClass: 'bg-amber-500',
        cardClass: 'bg-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400',
        statusText: t('gpsModerateStatus', { acc }),
        accText: `±${acc}m`
      };
    }
    return {
      level: 'red',
      dotClass: 'bg-rose-500',
      cardClass: 'bg-rose-500/5 border-rose-500/30 text-rose-600 dark:text-rose-400',
      statusText: t('gpsWeakStatus'),
      accText: ''
    };
  };

  const initialStatus = getGpsStatusData(currentCoordinates, isLocationConfirmed);

  container.innerHTML = `
    <div class="flex flex-col h-full w-full bg-[var(--surface)] text-[var(--text)] select-none">
      
      <!-- 1. Sticky Header: Title + Quota Chip + X Close Icon Button -->
      <div class="flex-shrink-0 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between z-10">
        <div class="flex items-center gap-2.5 min-w-0">
          <h2 id="report-panel-title" class="font-heading font-bold text-base sm:text-lg text-[var(--text)] truncate">
            ${t('sheetTitle')}
          </h2>
          <!-- Quota Chip -->
          <span class="tabular-nums text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
            quota.isLimitReached
              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          }">
            ${t('reportsRemainingBadge', { count: quota.remaining })}
          </span>
        </div>

        <!-- Proper X Close Icon Button -->
        <button
          id="btn-close-report-drawer"
          type="button"
          class="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="${t('closeAriaLabel')}"
          title="${t('closeAriaLabel')}"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 2. Scrollable Body: 3 Numbered Steps -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 overscroll-contain select-text">
        
        ${
          quota.isLimitReached
            ? `
          <!-- Limit Reached Notice Banner -->
          <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
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

        <!-- STEP 1: Photo Dropzone -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]">
              <span class="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-mono font-bold text-xs flex items-center justify-center">1</span>
              <span>${t('step1Title')}</span>
              <span class="text-rose-500 font-bold">*</span>
            </label>
          </div>

          <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" ${quota.isLimitReached ? 'disabled' : ''} />

          <div
            id="photo-dropzone"
            class="relative group ${quota.isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 border-dashed border-[var(--border)] hover:border-amber-500/60 rounded-xl p-3 bg-[var(--surface-2)] transition-all flex flex-col items-center justify-center min-h-[120px] max-h-[130px] overflow-hidden"
          >
            <!-- Empty Placeholder -->
            <div id="photo-placeholder" class="${processedImageData ? 'hidden' : 'flex'} flex-col items-center justify-center gap-1.5 text-center">
              <div class="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-amber-500 group-hover:scale-105 transition shadow-xs">
                ${getLucideIcon('camera', 'w-4 h-4')}
              </div>
              <div class="text-xs font-semibold text-[var(--text)]">
                ${t('takePhoto')}
              </div>
            </div>

            <!-- Uploaded Thumbnail Preview with Change Button -->
            <div id="photo-preview-container" class="${processedImageData ? 'flex' : 'hidden'} w-full items-center gap-3">
              <img id="photo-preview-img" src="${processedImageData?.previewUrl || ''}" class="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl border border-[var(--border)] shadow-xs shrink-0" alt="Pothole preview" />
              <div class="min-w-0 flex-1 space-y-1.5">
                <div id="photo-size-badge" class="inline-flex items-center gap-1 tabular-nums text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold">
                  <span>✓</span>
                  <span>${processedImageData ? t('photoOptimized', { size: processedImageData.compressedSizeKb || processedImageData.sizeKb || 120 }) : ''}</span>
                </div>
                <div>
                  <button
                    id="btn-change-photo"
                    type="button"
                    class="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>${t('changePhotoBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Location Verification Card -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]">
              <span class="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-mono font-bold text-xs flex items-center justify-center">2</span>
              <span>${t('step2Title')}</span>
              <span class="text-rose-500 font-bold">*</span>
            </label>
          </div>

          <!-- Single Merged Status Card (No dual 'Locked' vs 'Weak' conflict) -->
          <div id="gps-status-card" class="bg-[var(--surface-2)] border ${initialStatus.cardClass} rounded-xl p-3 transition-colors duration-200 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span id="gps-dot-indicator" class="w-2.5 h-2.5 rounded-full ${initialStatus.dotClass} shrink-0"></span>
                <div class="min-w-0">
                  <div id="gps-status-text" class="text-xs font-bold truncate">
                    ${initialStatus.statusText}
                  </div>
                  <div id="gps-coords-text" class="tabular-nums text-[11px] font-mono text-[var(--muted)] truncate">
                    ${formatCoords(currentCoordinates)}${initialStatus.accText ? ` (${initialStatus.accText})` : ''}
                  </div>
                </div>
              </div>

              <!-- Re-detect GPS Button -->
              <button
                id="btn-refresh-gps"
                type="button"
                class="btn-secondary px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                title="${t('reDetectGpsBtn')}"
                aria-label="${t('reDetectGpsBtn')}"
              >
                ${getLucideIcon('refresh', 'w-3.5 h-3.5')}
                <span class="text-[11px] font-semibold">${t('reDetectGpsBtn')}</span>
              </button>
            </div>

            <!-- Adjust on Map Button -->
            <button
              id="btn-open-map-picker"
              type="button"
              class="btn-secondary w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border-[var(--border)] hover:border-amber-500 hover:text-amber-500 transition cursor-pointer"
            >
              <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${t('adjustOnMapBtn')}</span>
            </button>
          </div>
        </div>

        <!-- STEP 3: Landmark Input (Optional) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="landmark-input" class="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]">
              <span class="w-5 h-5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-mono font-bold text-xs flex items-center justify-center">3</span>
              <span>${t('step3Title')}</span>
            </label>
            <span id="char-counter" class="tabular-nums text-[11px] font-mono text-[var(--muted)]">0/50</span>
          </div>
          <input
            type="text"
            id="landmark-input"
            maxlength="50"
            value="${options.landmark || ''}"
            placeholder="${t('landmarkPlaceholder')}"
            ${quota.isLimitReached ? 'disabled' : ''}
            class="w-full px-3.5 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent transition disabled:opacity-50"
          />
        </div>

        <!-- Anti-Spam Honeypot -->
        <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;" aria-hidden="true">
          <label for="website_hp">Leave this empty</label>
          <input type="text" id="website_hp" name="website_hp" tabindex="-1" autocomplete="off" />
        </div>
      </div>

      <!-- 3. Sticky Footer: Primary Amber Submit Button with Missing Reason Helper -->
      <div class="flex-shrink-0 p-4 sm:px-5 sm:py-4 border-t border-[var(--border)] bg-[var(--surface)] z-10 space-y-1.5">
        <button
          id="btn-submit-report"
          type="button"
          class="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-extrabold text-sm shadow-md transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          <span id="submit-btn-spinner" class="hidden w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          <span id="submit-btn-text"></span>
        </button>
        <!-- Helper text explaining missing items -->
        <div id="submit-helper-text" class="text-center text-[11px] text-[var(--muted)] font-medium"></div>
      </div>
    </div>
  `;

  // Attach DOM Listeners & Elements
  const closeBtn = container.querySelector('#btn-close-report-drawer');
  const fileInput = container.querySelector('#photo-input');
  const dropzone = container.querySelector('#photo-dropzone');
  const photoPlaceholder = container.querySelector('#photo-placeholder');
  const previewContainer = container.querySelector('#photo-preview-container');
  const previewImg = container.querySelector('#photo-preview-img');
  const sizeBadge = container.querySelector('#photo-size-badge');
  const changePhotoBtn = container.querySelector('#btn-change-photo');
  const landmarkInput = container.querySelector('#landmark-input');
  const charCounter = container.querySelector('#char-counter');
  const submitBtn = container.querySelector('#btn-submit-report');
  const submitSpinner = container.querySelector('#submit-btn-spinner');
  const submitText = container.querySelector('#submit-btn-text');
  const submitHelper = container.querySelector('#submit-helper-text');
  const refreshGpsBtn = container.querySelector('#btn-refresh-gps');
  const openMapPickerBtn = container.querySelector('#btn-open-map-picker');
  const gpsStatusCard = container.querySelector('#gps-status-card');
  const gpsDotIndicator = container.querySelector('#gps-dot-indicator');
  const gpsStatusText = container.querySelector('#gps-status-text');
  const gpsCoordsText = container.querySelector('#gps-coords-text');

  // Close Button Handler
  closeBtn?.addEventListener('click', () => {
    if (options.onClose) {
      options.onClose();
    }
  });

  // Calculate & Refresh Submit Button State
  const updateSubmitButtonState = () => {
    if (!submitBtn) return;

    if (quota.isLimitReached) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('dailyLimitReached');
      if (submitHelper) submitHelper.textContent = t('dailyLimitReached');
      return;
    }

    const hasPhoto = !!processedImageData;
    const isLocationOk = isLocationConfirmed || (currentCoordinates.accuracy || 0) <= 100;

    if (!hasPhoto && !isLocationOk) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('submitBtn');
      if (submitHelper) submitHelper.textContent = t('submitBtnMissingBoth');
      return;
    }

    if (!hasPhoto) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('submitBtn');
      if (submitHelper) submitHelper.textContent = t('submitBtnMissingPhoto');
      return;
    }

    if (!isLocationOk) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = t('submitBtn');
      if (submitHelper) submitHelper.textContent = t('submitBtnMissingLocation');
      return;
    }

    // Ready to Submit!
    submitBtn.disabled = false;
    if (submitText) submitText.textContent = t('submitBtn');
    if (submitHelper) submitHelper.textContent = '';
  };

  const updateGpsCardUI = (coords, confirmed = false) => {
    const statusData = getGpsStatusData(coords, confirmed);
    if (gpsStatusCard) {
      gpsStatusCard.className = `bg-[var(--surface-2)] border ${statusData.cardClass} rounded-xl p-3 transition-colors duration-200 space-y-2.5`;
    }
    if (gpsDotIndicator) {
      gpsDotIndicator.className = `w-2.5 h-2.5 rounded-full ${statusData.dotClass} shrink-0`;
    }
    if (gpsStatusText) {
      gpsStatusText.textContent = statusData.statusText;
    }
    if (gpsCoordsText) {
      gpsCoordsText.textContent = `${formatCoords(coords)}${statusData.accText ? ` (${statusData.accText})` : ''}`;
    }
    updateSubmitButtonState();
  };

  const markLocationConfirmed = (confirmed = true) => {
    isLocationConfirmed = confirmed;
    updateGpsCardUI(currentCoordinates, confirmed);
  };

  // Trigger file selection on dropzone or change-photo click
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-change-photo')) return;
    if (!quota.isLimitReached && !processedImageData) {
      fileInput?.click();
    }
  });

  changePhotoBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
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
        const sizeNum = processed.compressedSizeKb || processed.sizeKb || 120;
        sizeBadge.innerHTML = `<span>✓</span><span>${t('photoOptimized', { size: sizeNum })}</span>`;
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

  // Character Counter for Landmark (Max 50 characters)
  if (landmarkInput && charCounter) {
    charCounter.textContent = `${landmarkInput.value.length}/50`;
    landmarkInput.addEventListener('input', (e) => {
      charCounter.textContent = `${e.target.value.length}/50`;
    });
  }

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
        }
      });
    }
  };

  openMapPickerBtn?.addEventListener('click', () => {
    startMapPinConfirm();
  });

  // Acquire and update GPS state smoothly
  const acquireGps = async (forceRefresh = false) => {
    if (isGpsAcquiring) return;
    isGpsAcquiring = true;

    if (forceRefresh) {
      if (gpsStatusText) {
        gpsStatusText.textContent = t('gpsSearching');
      }
      if (gpsDotIndicator) {
        gpsDotIndicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0';
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
        setCachedUserLocation(coords, coords.source || 'gps');
        currentCoordinates = coords;
        const accuracy = coords.accuracy || 20;
        markLocationConfirmed(accuracy <= 100);
      }
    } catch (err) {
      console.warn('[ReportForm] Live GPS error:', err);
      if (currentCoordinates) {
        updateGpsCardUI(currentCoordinates, isLocationConfirmed);
      }
    } finally {
      isGpsAcquiring = false;
    }
  };

  // Only auto-acquire if not passed already confirmed coordinates
  if (!options.isLocationConfirmed) {
    acquireGps(false);
  }

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

    // Strict Validation: Max 20km from user's origin GPS location
    const realGps = getRealDeviceGps() || options.baseGps;
    if (realGps && typeof realGps.lat === 'number' && typeof realGps.lng === 'number') {
      const distKm = haversineDistanceKm(realGps.lat, realGps.lng, currentCoordinates.lat, currentCoordinates.lng);
      if (distKm > 20) {
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
    if (submitHelper) submitHelper.textContent = '';

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
      updateSubmitButtonState();
    }
  });

  // Initial Submit Button State Calculation
  updateSubmitButtonState();
}
