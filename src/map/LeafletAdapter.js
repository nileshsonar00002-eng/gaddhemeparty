import L from 'leaflet';
import 'leaflet.markercluster';
import { MapAdapter } from './MapAdapter';
import { t } from '../utils/i18n';

export class LeafletAdapter extends MapAdapter {
  constructor() {
    super();
    this.map = null;
    this.tileLayer = null;
    this.clusterGroup = null;
    this.markersMap = new Map();
    this.userMarker = null;
    this.defaultCenter = [22.5937, 78.9629]; // Center of India
    this.defaultZoom = 5;
    this.theme = 'dark';
    this.lastGestureEndTime = 0;
    this.isGestureActive = false;
    this.gestureTimeout = null;
  }

  getCenter() {
    if (!this.map) return { lat: 18.5204, lng: 73.8567 };
    const center = this.map.getCenter();
    return {
      lat: typeof center.lat === 'function' ? center.lat() : center.lat,
      lng: typeof center.lng === 'function' ? center.lng() : center.lng
    };
  }

  init(containerId, options = {}) {
    this.theme = options.theme || 'dark';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.map = L.map(containerId, {
      center: options.center || this.defaultCenter,
      zoom: options.zoom || this.defaultZoom,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false, // Cooperative zoom: requires Ctrl on desktop
      dragging: !isTouch,      // Single touch does not drag, 2 fingers drag
      maxBounds: [
        [4.0, 65.0],  // Southwest India buffer
        [39.0, 100.0] // Northeast India buffer
      ],
      minZoom: 4,
      maxZoom: 18
    });

    // Gesture tracking for debouncing stray taps
    this.map.on('movestart zoomstart dragstart', () => {
      this.isGestureActive = true;
    });

    this.map.on('moveend zoomend dragend', () => {
      this.isGestureActive = false;
      this.lastGestureEndTime = Date.now();
    });

    // Zoom-responsive marker and cluster scale synchronization (throttled with rAF)
    this.map.on('zoom zoomend', () => {
      this.updateZoomScales();
    });

    // Setup Cooperative Touch & Scroll Hints
    this.setupCooperativeGestures(containerId);

    this.applyTheme(this.theme);

    // Marker cluster group with glowing energy orbs and zoom-adaptive cluster radius
    this.clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: (zoom) => {
        if (zoom <= 5) return 75;
        if (zoom <= 8) return 55;
        if (zoom <= 12) return 40;
        return 30;
      },
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="custom-cluster-civic"><span>${count}</span></div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        });
      }
    });

    this.map.addLayer(this.clusterGroup);
    this.updateZoomScales();
    return this;
  }

  updateZoomScales() {
    if (this.zoomRafId) cancelAnimationFrame(this.zoomRafId);
    this.zoomRafId = requestAnimationFrame(() => {
      if (!this.map) return;
      const zoom = this.map.getZoom();
      // Interpolate: zoom 4 -> glow 0.3x, core 0.6x; zoom 16+ -> glow 1.6x, core 1.25x
      const t = Math.max(0, Math.min(1.2, (zoom - 4) / 12));
      const glowScale = (0.3 + t * 1.3).toFixed(3);
      const coreScale = (0.6 + t * 0.65).toFixed(3);
      const container = this.map.getContainer ? this.map.getContainer() : document.getElementById('map');
      if (container) {
        container.style.setProperty('--glow-scale', glowScale);
        container.style.setProperty('--core-scale', coreScale);
      }
    });
  }

  setupCooperativeGestures(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create or locate gesture hint overlay
    let overlay = container.querySelector('.map-gesture-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'map-gesture-overlay';
      overlay.innerHTML = `<span class="map-gesture-text text-sm font-heading font-bold text-white bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl"></span>`;
      container.appendChild(overlay);
    }

    const showHint = (msg) => {
      const textEl = overlay.querySelector('.map-gesture-text');
      if (textEl) textEl.innerText = msg;
      overlay.classList.add('active');
      clearTimeout(this.gestureTimeout);
      this.gestureTimeout = setTimeout(() => {
        overlay.classList.remove('active');
      }, 1200);
    };

    // Mobile touch handling: 2 fingers pan, 1 finger scrolls page & shows hint
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        this.map.dragging.enable();
      } else {
        this.map.dragging.disable();
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        showHint(t('gestureHintMobile'));
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      this.map.dragging.disable();
    }, { passive: true });

    // Desktop wheel handling: Ctrl+wheel zooms, wheel alone scrolls page & shows hint
    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.map.zoomIn();
        } else if (e.deltaY > 0) {
          this.map.zoomOut();
        }
      } else {
        showHint(t('gestureHintDesktop'));
      }
    }, { passive: false });
  }

  applyTheme(theme = 'dark') {
    this.theme = theme;
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    this.tileLayer = L.tileLayer(osmTileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19
    }).addTo(this.map);
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  setView(lat, lng, zoom = 16) {
    if (!this.map) return;
    this.map.flyTo([lat, lng], zoom, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25
    });
  }

  zoomIn() {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut() {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  centerOnIndia() {
    this.setView(this.defaultCenter[0], this.defaultCenter[1], this.defaultZoom);
  }

  resize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  cinematicFlyIn(callback) {
    if (!this.map) return;
    // Start at high-altitude world view
    this.map.setView([20.5937, 78.9629], 3.5, { animate: false });
    // Smoothly fly in to India view with cubic easing
    setTimeout(() => {
      if (!this.map) return;
      this.map.flyTo([22.5937, 78.9629], 5, {
        animate: true,
        duration: 2.2,
        easeLinearity: 0.25
      });
      if (callback) setTimeout(callback, 2300);
    }, 150);
  }

  playArrivalRipple(lat, lng) {
    if (!this.map) return;
    const rippleIcon = L.divIcon({
      className: 'new-arrival-ripple-container',
      html: `<div class="new-arrival-ripple w-8 h-8 rounded-full"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const rippleMarker = L.marker([lat, lng], { icon: rippleIcon }).addTo(this.map);
    setTimeout(() => {
      if (this.map && rippleMarker) {
        this.map.removeLayer(rippleMarker);
      }
    }, 4500);
  }

  renderPins(pins, onPinClick, createPopupHtml) {
    if (!this.clusterGroup) return;

    this.clusterGroup.clearLayers();
    this.markersMap.clear();

    pins.forEach((pin) => {
      if (!pin.latitude || !pin.longitude) return;

      const reportCount = pin.reportCount || 1;
      const upvotes = pin.upvotes || 0;
      const photoCount = Array.isArray(pin.images) ? pin.images.length : (pin.imageUrl ? 1 : 0);
      const isSevere = reportCount >= 5 || upvotes >= 5 || photoCount >= 5;
      const isMedium = (reportCount >= 2 || upvotes >= 2 || photoCount >= 2) && !isSevere;
      
      const orbTierClass = isSevere ? 'pin-tier-3' : isMedium ? 'pin-tier-2' : 'pin-tier-1';
      const orbSize = isSevere ? 28 : (isMedium ? 24 : 18);
      const badgeCount = Math.max(reportCount, photoCount);

      // Glowing Orb HTML ("Earth at Night / Glowing City Light Node") with Scale Wrapper
      const iconHtml = `
        <div class="pin-scale-wrapper">
          <div class="civic-pin ${orbTierClass}" style="width: ${orbSize}px; height: ${orbSize}px;" title="${pin.landmark || 'Hazard'}">
            ${badgeCount > 1 ? `<span class="tabular-nums">${badgeCount}</span>` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'pothole-pin-icon',
        html: iconHtml,
        iconSize: [orbSize, orbSize],
        iconAnchor: [orbSize / 2, orbSize / 2],
        popupAnchor: [0, -orbSize]
      });

      const marker = L.marker([pin.latitude, pin.longitude], { icon: customIcon });

      if (createPopupHtml && !onPinClick) {
        const popupContent = createPopupHtml(pin);
        marker.bindPopup(popupContent, {
          maxWidth: 320,
          minWidth: 280,
          autoPan: true,
          autoPanPaddingTopLeft: L.point(20, 140),
          autoPanPaddingBottomRight: L.point(20, 80),
          className: 'custom-pothole-popup'
        });
      }

      marker.on('click', () => {
        // Drop click if user was actively dragging/zooming or just finished (< 300ms)
        if (this.isGestureActive || Date.now() - this.lastGestureEndTime < 300) {
          return;
        }
        if (onPinClick) onPinClick(pin);
      });

      this.clusterGroup.addLayer(marker);
      this.markersMap.set(pin.id, marker);
    });
  }

  setUserLocationMarker(lat, lng) {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <div class="absolute w-7 h-7 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
            <div class="relative w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-lg"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      this.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);
    }
  }

  onMoveEnd(callback) {
    if (this.map) {
      this.map.on('moveend', () => {
        callback(this.getBounds());
      });
    }
  }

  getBounds() {
    if (!this.map) return null;
    const b = this.map.getBounds();
    return {
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLng: b.getWest(),
      maxLng: b.getEast()
    };
  }

  openPopup(pinId) {
    const marker = this.markersMap.get(pinId);
    if (marker) {
      marker.openPopup();
    }
  }

  closePopup() {
    if (this.map) {
      this.map.closePopup();
    }
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
