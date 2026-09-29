import { t } from '../utils/i18n';
import { processPotholeImage } from '../utils/imageProcessor';
import { getActionQuota } from '../utils/upvoteStorage';

export function renderReportForm(container, options = {}) {
  const formOpenTime = Date.now();
  let currentCoordinates = options.currentCoordinates || null;
  let processedImageData = null;
  const quota = getActionQuota();

  container.innerHTML = `
    <div class="space-y-4 text-[var(--text-primary)]">
      <!-- Title & Subtitle with Quota Badge -->
      <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 class="font-heading font-extrabold text-xl text-[var(--text-primary)]">
              ${t('sheetTitle')}
            </h2>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
              quota.isLimitReached
                ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }">
              ${t('reportsRemainingBadge', { count: quota.remaining })}
            </span>
          </div>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">${t('sheetSubtitle')}</p>
        </div>
      </div>

      ${
        quota.isLimitReached
          ? `
        <!-- Limit Reached Notice Banner -->
        <div class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
          <svg class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <div class="font-bold text-rose-600 dark:text-rose-200">${t('dailyLimitReached')}</div>
            <div class="text-[11px] text-rose-600/80 dark:text-rose-300/80 mt-0.5">
              ${t('nextReportAvailable', { time: quota.waitFormatted || 'कुछ समय' })}
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Photo Upload Dropzone -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          ${t('tapToPhoto')} <span class="text-rose-500">*</span>
        </label>
        
        <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" ${quota.isLimitReached ? 'disabled' : ''} />

        <div id="photo-dropzone" class="relative group ${quota.isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 border-dashed border-[var(--border-color)] hover:border-amber-500/80 rounded-2xl p-4 bg-[var(--bg-card-subtle)] transition-all flex flex-col items-center justify-center min-h-[140px] text-center overflow-hidden">
          <div id="photo-placeholder" class="flex flex-col items-center justify-center gap-2">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--accent-amber-text)] group-hover:scale-110 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div class="text-xs font-bold text-[var(--text-secondary)]">
              <span class="text-[var(--accent-amber-text)] font-heading text-sm">${t('takePhoto')}</span>
            </div>
            <p class="text-[11px] text-[var(--text-muted)]">${t('photoOptNote')}</p>
          </div>

          <!-- Live Preview Canvas / Image -->
          <div id="photo-preview-container" class="hidden w-full relative flex flex-col items-center">
            <img id="photo-preview-img" class="w-full max-h-[170px] object-cover rounded-2xl border border-[var(--border-color)] shadow-md" alt="Pothole preview" />
            <div id="photo-size-badge" class="mt-2 text-[11px] font-mono px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"></div>
          </div>
        </div>
      </div>

      <!-- GPS Location Status Chip -->
      <div class="bg-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-2xl p-3.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div id="gps-indicator" class="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
            <div>
              <div id="gps-status-text" class="text-xs font-bold text-[var(--text-primary)]">
                ${t('gpsSearching')}
              </div>
              <div id="gps-coords-text" class="text-[11px] font-mono text-[var(--text-muted)]">
                ${currentCoordinates ? `${currentCoordinates.lat.toFixed(5)}, ${currentCoordinates.lng.toFixed(5)}` : t('gpsSearching')}
              </div>
            </div>
          </div>
          <button id="btn-refresh-gps" type="button" class="p-2 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] rounded-xl border border-[var(--border-color)] active:scale-95 transition" title="${t('gpsRetry')}">
            <svg class="w-4 h-4 text-[var(--accent-amber-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>

      <!-- Landmark & Description Input -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="landmark-input" class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            ${t('landmarkLabel')}
          </label>
          <span id="char-counter" class="text-[10px] font-mono text-[var(--text-muted)]">0/100</span>
        </div>
        <input
          type="text"
          id="landmark-input"
          maxlength="100"
          placeholder="${t('landmarkPlaceholder')}"
          ${quota.isLimitReached ? 'disabled' : ''}
          class="w-full px-4 py-3 bg-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent transition disabled:opacity-50"
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
        class="w-full mt-2 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-[0.98] text-slate-950 font-heading font-extrabold text-base sm:text-lg rounded-2xl shadow-pill transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span id="submit-btn-spinner" class="hidden w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
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
  const gpsStatusText = container.querySelector('#gps-status-text');
  const gpsCoordsText = container.querySelector('#gps-coords-text');
  const gpsIndicator = container.querySelector('#gps-indicator');

  if (!quota.isLimitReached) {
    dropzone?.addEventListener('click', () => fileInput?.click());
  }

  // Image Processing Listener
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    photoPlaceholder?.classList.add('hidden');
    previewContainer?.classList.remove('hidden');
    previewImg.src = '';
    sizeBadge.innerText = t('photoCompressing');

    try {
      processedImageData = await processPotholeImage(file);
      previewImg.src = processedImageData.previewUrl;
      sizeBadge.innerText = t('photoOptimized', { size: processedImageData.compressedSizeKb });
    } catch (err) {
      console.error('Image processing error:', err);
      sizeBadge.innerText = t('photoError');
    }
  });

  // Landmark character counter
  landmarkInput?.addEventListener('input', (e) => {
    const len = e.target.value.length;
    charCounter.innerText = `${len}/100`;
  });

  // GPS Acquisition
  const acquireLocation = () => {
    gpsStatusText.innerText = t('gpsSearching');
    gpsIndicator.className = 'w-3 h-3 rounded-full bg-amber-500 animate-ping';

    if (!navigator.geolocation) {
      gpsStatusText.innerText = t('gpsUnsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        gpsStatusText.innerText = t('gpsLocked');
        gpsCoordsText.innerText = `${currentCoordinates.lat.toFixed(5)}, ${currentCoordinates.lng.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`;
        gpsIndicator.className = 'w-3 h-3 rounded-full bg-emerald-400';
      },
      (err) => {
        gpsStatusText.innerText = t('locationDenied');
        gpsIndicator.className = 'w-3 h-3 rounded-full bg-rose-500';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  refreshGpsBtn?.addEventListener('click', acquireLocation);
  if (!currentCoordinates) {
    acquireLocation();
  } else {
    gpsStatusText.innerText = t('gpsLocked');
    gpsIndicator.className = 'w-3 h-3 rounded-full bg-emerald-400';
  }

  // Submit Handler
  submitBtn?.addEventListener('click', async () => {
    if (quota.isLimitReached) {
      return;
    }

    if (!currentCoordinates) {
      alert(t('gpsRequiredAlert'));
      acquireLocation();
      return;
    }

    submitBtn.disabled = true;
    submitSpinner.classList.remove('hidden');
    submitText.innerText = t('submitting');

    const honeypotVal = container.querySelector('#website_hp')?.value || '';
    const landmarkVal = landmarkInput.value;

    const payload = {
      latitude: currentCoordinates.lat,
      longitude: currentCoordinates.lng,
      landmark: landmarkVal,
      website_hp: honeypotVal,
      formOpenTime,
      imageData: processedImageData
    };

    if (options.onSubmit) {
      await options.onSubmit(payload);
    }

    submitBtn.disabled = false;
    submitSpinner.classList.add('hidden');
    submitText.innerText = t('submitBtn');
  });
}
