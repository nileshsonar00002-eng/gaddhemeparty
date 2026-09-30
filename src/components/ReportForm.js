import L from 'leaflet';
import { t, getLanguage } from '../utils/i18n';
import { processPotholeImage } from '../utils/imageProcessor';
import { getActionQuota } from '../utils/upvoteStorage';
import { getLucideIcon } from '../utils/icons';
import { getLiveUserLocation, getCachedUserLocation, setCachedUserLocation } from '../utils/geo';
import { INDIAN_CITIES } from '../utils/cities';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '../map/GoogleMapsAdapter';

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
  let isLocationConfirmed = (fallbackCoords.accuracy || 50) <= 100;
  let processedImageData = null;
  const quota = getActionQuota();

  let googleMiniMap = null;
  let googleMiniMarker = null;
  let leafletMiniMap = null;
  let leafletMiniMarker = null;

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

        <div id="photo-dropzone" class="relative group ${quota.isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 bg-[var(--surface-2)] transition-all flex flex-col items-center justify-center min-h-[120px] text-center overflow-hidden">
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

      <!-- Step: Confirm Location on Map with Draggable Pin -->
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
        <div id="gps-status-card" class="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-2.5 transition-colors duration-200 flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span id="gps-dot-indicator" class="w-2.5 h-2.5 rounded-full ${isLocationConfirmed ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0"></span>
            <div class="min-w-0">
              <div id="gps-status-text" class="text-xs font-semibold truncate ${isLocationConfirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
                ${isLocationConfirmed ? t('gpsLocked') : t('gpsSearching')}
              </div>
              <div id="gps-coords-text" class="tabular-nums text-[11px] font-mono text-[var(--muted)] truncate">
                ${formatCoords(currentCoordinates)}
              </div>
            </div>
          </div>

          <button id="btn-refresh-gps" type="button" class="btn-secondary px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1 cursor-pointer shrink-0" title="${t('gpsRetry')}" aria-label="${t('gpsRetry')}">
            ${getLucideIcon('refresh', 'w-3.5 h-3.5')}
            <span class="text-[11px] font-medium hidden sm:inline">GPS</span>
          </button>
        </div>

        <!-- Weak GPS Warning Banner (>100m accuracy) -->
        <div id="weak-gps-warning" class="${(currentCoordinates.accuracy || 0) > 100 && !isLocationConfirmed ? 'flex' : 'hidden'} bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-700 dark:text-amber-400 items-start gap-2">
          ${getLucideIcon('alert', 'w-4 h-4 shrink-0 mt-0.5 text-amber-500')}
          <span class="leading-relaxed">${t('weakGpsWarning')}</span>
        </div>

        <!-- Interactive Mini-Map Container -->
        <div class="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
          <div id="report-mini-map" class="w-full h-44 sm:h-52 z-0"></div>
          
          <!-- Confirm Spot Overlay Button if Unconfirmed -->
          <div id="confirm-spot-overlay" class="${!isLocationConfirmed ? 'flex' : 'hidden'} absolute bottom-2 left-2 right-2 z-[400] justify-center">
            <button id="btn-confirm-spot" type="button" class="btn-primary py-1.5 px-4 text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer">
              ${getLucideIcon('check', 'w-3.5 h-3.5')}
              <span>${t('confirmLocationBtn')}</span>
            </button>
          </div>
        </div>

        <!-- Mini-Map Helper Text -->
        <div class="flex items-center gap-1.5 text-xs text-[var(--muted)] px-0.5">
          ${getLucideIcon('info', 'w-3.5 h-3.5 shrink-0 text-[var(--accent)]')}
          <span class="leading-tight">${t('dragPinHelper')}</span>
        </div>

        <!-- Location Controls: Quick Map Location & City Selector -->
        <div class="pt-1 flex items-center gap-2 text-xs flex-wrap">
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
        ${quota.isLimitReached || (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100) ? 'disabled' : ''}
        class="btn-primary w-full mt-2 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span id="submit-btn-spinner" class="hidden w-4 h-4 border-2 border-[var(--accent-ink)] border-t-transparent rounded-full animate-spin"></span>
        <span id="submit-btn-text">
          ${
            quota.isLimitReached
              ? t('dailyLimitReached')
              : (!isLocationConfirmed && (currentCoordinates.accuracy || 0) > 100)
              ? (isHindi ? 'पहले लोकेशन कन्फर्म करें' : 'Confirm Location First')
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
  const useMapCenterBtn = container.querySelector('#btn-use-map-center');
  const citySelect = container.querySelector('#select-quick-city');
  const gpsStatusCard = container.querySelector('#gps-status-card');
  const gpsDotIndicator = container.querySelector('#gps-dot-indicator');
  const gpsStatusText = container.querySelector('#gps-status-text');
  const gpsCoordsText = container.querySelector('#gps-coords-text');
  const pinConfirmBadge = container.querySelector('#pin-confirm-badge');
  const weakGpsWarning = container.querySelector('#weak-gps-warning');
  const confirmSpotOverlay = container.querySelector('#confirm-spot-overlay');
  const confirmSpotBtn = container.querySelector('#btn-confirm-spot');

  // Draggable Pin Icon definition for Leaflet fallback
  const pinIcon = L.divIcon({
    className: 'custom-report-pin',
    html: `
      <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-full hover:scale-110 transition duration-150">
        <div class="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-md flex items-center justify-center border-2 border-white ring-2 ring-black/20">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });

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

    if (weakGpsWarning) {
      if (confirmed || (currentCoordinates.accuracy || 0) <= 100) {
        weakGpsWarning.classList.add('hidden');
        weakGpsWarning.classList.remove('flex');
      } else {
        weakGpsWarning.classList.remove('hidden');
        weakGpsWarning.classList.add('flex');
      }
    }

    if (confirmSpotOverlay) {
      if (confirmed) {
        confirmSpotOverlay.classList.add('hidden');
        confirmSpotOverlay.classList.remove('flex');
      } else {
        confirmSpotOverlay.classList.remove('hidden');
        confirmSpotOverlay.classList.add('flex');
      }
    }

    if (submitBtn && !quota.isLimitReached) {
      if (confirmed || (currentCoordinates.accuracy || 0) <= 100) {
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = t('submitBtn');
      } else {
        submitBtn.disabled = true;
        if (submitText) submitText.textContent = isHindi ? 'पहले लोकेशन कन्फर्म करें' : 'Confirm Location First';
      }
    }
  };

  const initMiniMap = () => {
    const mapMount = container.querySelector('#report-mini-map');
    if (!mapMount || googleMiniMap || leafletMiniMap) return;

    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';

    // 1. Prefer Google Maps if JS API is loaded and available
    if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
      try {
        const gCenter = { lat: currentCoordinates.lat, lng: currentCoordinates.lng };
        googleMiniMap = new google.maps.Map(mapMount, {
          center: gCenter,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          clickableIcons: false,
          styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE
        });

        googleMiniMarker = new google.maps.Marker({
          position: gCenter,
          map: googleMiniMap,
          draggable: true,
          title: isHindi ? 'गड्ढे का स्थान (खींचें)' : 'Pothole Location (Drag)'
        });

        googleMiniMarker.addListener('dragend', (e) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          currentCoordinates.lat = lat;
          currentCoordinates.lng = lng;
          currentCoordinates.accuracy = 5;
          markLocationConfirmed(true);
          updateGpsUI(currentCoordinates, false);
        });

        googleMiniMap.addListener('click', (e) => {
          if (!e.latLng) return;
          googleMiniMarker?.setPosition(e.latLng);
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          currentCoordinates.lat = lat;
          currentCoordinates.lng = lng;
          currentCoordinates.accuracy = 5;
          markLocationConfirmed(true);
          updateGpsUI(currentCoordinates, false);
        });

        return;
      } catch (gErr) {
        console.warn('[ReportForm] Google Maps mini-map fallback to Leaflet:', gErr);
      }
    }

    // 2. Leaflet Fallback (100% Free Carto/OSM tiles without API key requirements)
    try {
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      leafletMiniMap = L.map(mapMount, {
        center: [currentCoordinates.lat, currentCoordinates.lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true
      });

      L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMiniMap);

      leafletMiniMarker = L.marker([currentCoordinates.lat, currentCoordinates.lng], {
        draggable: true,
        icon: pinIcon
      }).addTo(leafletMiniMap);

      leafletMiniMarker.on('dragend', () => {
        const pos = leafletMiniMarker.getLatLng();
        currentCoordinates.lat = pos.lat;
        currentCoordinates.lng = pos.lng;
        currentCoordinates.accuracy = 5;
        markLocationConfirmed(true);
        updateGpsUI(currentCoordinates, false);
      });

      leafletMiniMap.on('click', (e) => {
        leafletMiniMarker.setLatLng(e.latlng);
        currentCoordinates.lat = e.latlng.lat;
        currentCoordinates.lng = e.latlng.lng;
        currentCoordinates.accuracy = 5;
        markLocationConfirmed(true);
        updateGpsUI(currentCoordinates, false);
      });

      setTimeout(() => {
        leafletMiniMap?.invalidateSize();
      }, 250);
    } catch (lErr) {
      console.warn('[ReportForm] Leaflet mini-map init error:', lErr);
    }
  };

  // Initialize mini-map after DOM is mounted
  setTimeout(() => {
    initMiniMap();
  }, 50);

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
      gpsStatusCard.className = 'bg-[var(--surface-2)] border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-2.5 transition-colors duration-200 flex items-center justify-between';
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

    // Update Google Maps mini-map if active
    if (googleMiniMap && googleMiniMarker) {
      const gPos = { lat: coords.lat, lng: coords.lng };
      googleMiniMarker.setPosition(gPos);
      googleMiniMap.panTo(gPos);
    }

    // Update Leaflet mini-map if active
    if (leafletMiniMap && leafletMiniMarker) {
      leafletMiniMarker.setLatLng([coords.lat, coords.lng]);
      leafletMiniMap.setView([coords.lat, coords.lng], 16, { animate: true });
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

  // Automatically acquire fresh GPS immediately on mount
  acquireGps(false);

  // Manual GPS Refresh Button Handler
  refreshGpsBtn?.addEventListener('click', () => {
    acquireGps(true);
  });

  // Confirm spot button handler
  confirmSpotBtn?.addEventListener('click', () => {
    markLocationConfirmed(true);
  });

  // Use Map Center Handler
  useMapCenterBtn?.addEventListener('click', () => {
    let center = null;
    if (options.getMapCenter) {
      center = options.getMapCenter();
    } else if (options.mapCenter) {
      center = options.mapCenter;
    }
    if (center && center.lat && center.lng) {
      center.accuracy = 10;
      markLocationConfirmed(true);
      updateGpsUI(center, false);
    }
  });

  // City Selection Handler
  citySelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const [lat, lng] = val.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        const cityCoord = { lat, lng, accuracy: 25, source: 'city_select' };
        markLocationConfirmed(true);
        updateGpsUI(cityCoord, false);
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
