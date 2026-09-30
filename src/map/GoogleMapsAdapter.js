import { MapAdapter } from './MapAdapter';

// Clean Dark Map Styling: POIs hidden, Transit hidden, Land Parcels hidden, High-contrast roads & cities
export const DARK_MAP_STYLE = [
  // Global canvas background
  { elementType: 'geometry', stylers: [{ color: '#0B0F19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 3 }] },

  // 1. Completely Hide All POIs (shops, restaurants, hospitals, schools, parks, etc.)
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },

  // 2. Completely Hide Transit lines, stations, and icons
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.line', stylers: [{ visibility: 'off' }] },

  // 3. Completely Hide Land parcels & building footprint clutter
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', stylers: [{ visibility: 'off' }] },

  // 4. Landscape base geometry
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0C1322' }] },

  // 5. Water bodies (Very deep dark navy abyss)
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050811' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#050811' }, { weight: 2 }] },

  // 6. Roads: Earth at night glowing city light arterial lines
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#141E30' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#090E17' }, { weight: 1 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 3.5 }] },

  // Highways (Warm glowing amber lines like night aerial highway photos)
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#78350F' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#D97706' }, { weight: 1.2 }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#FEF08A' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 4 }] },

  // Arterial Roads (Luminous icy-blue city corridors)
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#38BDF8' }, { weight: 0.8 }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#F8FAFC' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 3 }] },

  // Local Roads
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'road.local', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 2.5 }] },

  // 7. Administrative / City / Area Names (Clear at zoom 13+)
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 4.5 }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.stroke', stylers: [{ color: '#080C14' }, { weight: 3 }] },
  { featureType: 'administrative.province', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }, { weight: 1.5 }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] }
];

// Clean Light Map Styling (High-contrast roads & clear labels, POIs hidden)
export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#E6EAEE' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DDE5DE' }, { visibility: 'simplified' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E6EAEE' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9D6E2' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#C5CCD6' }, { weight: 1 }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#B0BAC7' }, { weight: 1.2 }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#C5CCD6' }, { weight: 1 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#0F172A' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 4 }] }
];

// Custom Overlay to render animated HTML pins on Google Maps
class HTMLMarkerOverlay {
  constructor(map, position, htmlContent, onClick, zIndex = 10, paneName = 'overlayMouseTarget') {
    this.map = map;
    this.position = new google.maps.LatLng(position.lat, position.lng);
    this.htmlContent = htmlContent;
    this.onClick = onClick;
    this.zIndex = zIndex;
    this.paneName = paneName;
    this.div = null;

    this.overlay = new google.maps.OverlayView();
    const self = this;

    this.overlay.onAdd = function () {
      self.div = document.createElement('div');
      self.div.className = 'gmap-marker-anchor';
      self.div.style.position = 'absolute';
      self.div.style.width = '0px';
      self.div.style.height = '0px';
      self.div.style.margin = '0px';
      self.div.style.padding = '0px';
      self.div.style.pointerEvents = 'none';
      self.div.style.userSelect = 'none';
      self.div.style.zIndex = String(self.zIndex || 10);
      self.div.innerHTML = self.htmlContent;

      if (self.onClick) {
        self.div.addEventListener('click', (e) => {
          e.stopPropagation();
          self.onClick(e);
        });
      }

      const panes = this.getPanes();
      const targetPane = (panes && panes[self.paneName]) ? panes[self.paneName] : (panes ? panes.overlayMouseTarget : null);
      if (targetPane) {
        targetPane.appendChild(self.div);
      }
    };

    this.overlay.draw = function () {
      const overlayProjection = this.getProjection();
      if (!overlayProjection || !self.div) return;

      const point = overlayProjection.fromLatLngToDivPixel(self.position);
      if (point) {
        self.div.style.left = `${point.x}px`;
        self.div.style.top = `${point.y}px`;
      }
    };

    this.overlay.onRemove = function () {
      if (self.div && self.div.parentNode) {
        self.div.parentNode.removeChild(self.div);
        self.div = null;
      }
    };

    this.overlay.setMap(map);
  }

  setMap(map) {
    if (this.overlay) {
      this.overlay.setMap(map);
    }
  }

  getPosition() {
    return this.position;
  }

  setPosition(latLng) {
    if (!latLng) return;
    this.position = latLng instanceof google.maps.LatLng ? latLng : new google.maps.LatLng(latLng.lat, latLng.lng);
    if (this.overlay && this.overlay.draw) {
      this.overlay.draw();
    }
  }

  triggerClick() {
    if (this.onClick) {
      this.onClick();
    }
  }
}

export class GoogleMapsAdapter extends MapAdapter {
  constructor() {
    super();
    this.map = null;
    this.markersMap = new Map();
    this.infoWindow = null;
    this.userMarker = null;
    this.defaultCenter = { lat: 22.5937, lng: 78.9629 };
    this.defaultZoom = 5;
    this.theme = 'dark';
    this.lastGestureEndTime = 0;
    this.isGestureActive = false;
  }

  getCenter() {
    if (!this.map) return { lat: 18.5204, lng: 73.8567 };
    const center = this.map.getCenter();
    return {
      lat: typeof center?.lat === 'function' ? center.lat() : (center?.lat || 18.5204),
      lng: typeof center?.lng === 'function' ? center.lng() : (center?.lng || 73.8567)
    };
  }

  async loadGoogleMapsScript(apiKey) {
    if (window.google && window.google.maps) {
      return window.google.maps;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&region=IN&language=hi`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = (e) => reject(new Error('Google Maps script failed to load: ' + e));
      document.head.appendChild(script);
    });
  }

  async init(containerId, options = {}) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || null;
    this.theme = options.theme || 'dark';

    try {
      await this.loadGoogleMapsScript(apiKey);
    } catch (err) {
      console.error('[GoogleMapsAdapter] Failed to load Google Maps script:', err);
      throw err;
    }

    const container = document.getElementById(containerId);
    if (!container) return this;

    const mapOptions = {
      center: options.center ? { lat: options.center[0], lng: options.center[1] } : this.defaultCenter,
      zoom: options.zoom || this.defaultZoom,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false, // Strictly prevents POIs from intercepting clicks
      gestureHandling: 'cooperative', // 2-finger pan on mobile, Ctrl+scroll on desktop
      backgroundColor: '#080C14',
      minZoom: 4,
      maxZoom: 19,
      restriction: {
        latLngBounds: {
          north: 37.5,
          south: 6.5,
          west: 68.0,
          east: 97.5
        },
        strictBounds: false
      }
    };

    if (mapId) {
      mapOptions.mapId = mapId;
    } else {
      mapOptions.styles = this.theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
    }

    this.map = new google.maps.Map(container, mapOptions);

    // Track user gesture timestamps to debounce stray click events fired on drag/zoom completion
    this.map.addListener('dragstart', () => {
      this.isGestureActive = true;
    });

    this.map.addListener('dragend', () => {
      this.isGestureActive = false;
      this.lastGestureEndTime = Date.now();
    });

    this.map.addListener('zoom_changed', () => {
      this.lastGestureEndTime = Date.now();
      this.updateZoomScales();
    });

    this.infoWindow = new google.maps.InfoWindow({
      maxWidth: 320
    });

    this.updateZoomScales();
    return this;
  }

  updateZoomScales() {
    if (this.zoomRafId) cancelAnimationFrame(this.zoomRafId);
    this.zoomRafId = requestAnimationFrame(() => {
      if (!this.map) return;
      const zoom = this.map.getZoom() || this.defaultZoom;
      // Interpolate: zoom 4 -> 0.7x; zoom 18 -> 1.25x
      const t = Math.max(0, Math.min(1.2, (zoom - 4) / 14));
      const pinScale = (0.7 + t * 0.55).toFixed(3);
      const container = document.getElementById('map');
      if (container) {
        container.style.setProperty('--pin-scale', pinScale);
        container.style.setProperty('--core-scale', pinScale);
        container.style.setProperty('--glow-scale', pinScale);
      }
    });
  }

  applyTheme(theme = 'dark') {
    this.theme = theme;
    if (this.map) {
      const options = {
        backgroundColor: theme === 'dark' ? '#080C14' : '#F8FAFC'
      };

      if (window.google && window.google.maps && google.maps.ColorScheme) {
        options.colorScheme = theme === 'dark' ? google.maps.ColorScheme.DARK : google.maps.ColorScheme.LIGHT;
      }

      const darkMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_DARK;
      const lightMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_LIGHT;
      const singleMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

      if (theme === 'dark' && darkMapId) {
        options.mapId = darkMapId;
      } else if (theme === 'light' && lightMapId) {
        options.mapId = lightMapId;
      } else if (!singleMapId) {
        options.styles = theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
      }

      this.map.setOptions(options);
    }
  }

  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    return next;
  }

  panBy(x, y) {
    if (this.map && typeof this.map.panBy === 'function') {
      this.map.panBy(x, y);
    }
  }

  setView(lat, lng, zoom = 16) {
    if (!this.map) return;
    this.map.panTo({ lat, lng });
    this.map.setZoom(zoom);
  }

  zoomIn() {
    if (this.map) {
      const current = this.map.getZoom() || 15;
      this.map.setZoom(current + 1);
    }
  }

  zoomOut() {
    if (this.map) {
      const current = this.map.getZoom() || 15;
      this.map.setZoom(Math.max(1, current - 1));
    }
  }

  centerOnIndia() {
    this.setView(this.defaultCenter.lat, this.defaultCenter.lng, this.defaultZoom);
  }

  resize() {
    if (this.map && window.google && window.google.maps) {
      google.maps.event.trigger(this.map, 'resize');
    }
  }

  cinematicFlyIn(callback) {
    if (!this.map) return;
    // Set initial altitude (world view)
    this.map.setCenter({ lat: 20.5937, lng: 78.9629 });
    this.map.setZoom(3);
    
    // Smoothly zoom in to India bounds
    setTimeout(() => {
      if (!this.map) return;
      this.map.panTo({ lat: 22.5937, lng: 78.9629 });
      this.map.setZoom(5);
      if (callback) setTimeout(callback, 2200);
    }, 200);
  }

  playArrivalRipple(lat, lng) {
    if (!this.map || !window.google || !window.google.maps) return;
    const rippleDiv = document.createElement('div');
    rippleDiv.className = 'new-arrival-ripple w-8 h-8 rounded-full pointer-events-none';
    const rippleOverlay = new HTMLMarkerOverlay(
      this.map,
      { lat, lng },
      rippleDiv.outerHTML,
      null
    );
    setTimeout(() => {
      rippleOverlay.setMap(null);
    }, 4500);
  }

  renderPins(pins, onPinClick) {
    this.pinsData = pins || [];
    this.onPinClickCallback = onPinClick;

    if (!this.map || !window.google || !window.google.maps) return;

    if (!this.hasIdleClusterListener) {
      this.hasIdleClusterListener = true;
      this.map.addListener('idle', () => {
        this.clusterAndRenderPins();
      });
    }

    this.clusterAndRenderPins();
  }

  clusterAndRenderPins() {
    if (!this.map || !window.google || !window.google.maps) return;

    // Clear existing markers
    this.markersMap.forEach((marker) => marker.setMap(null));
    this.markersMap.clear();

    const allPins = this.pinsData || [];
    if (allPins.length === 0) return;

    const zoom = this.map.getZoom() || this.defaultZoom;

    // At zoom >= 14, always render individual unclustered pins
    if (zoom >= 14) {
      allPins.forEach((pin) => this.createSinglePinMarker(pin));
      return;
    }

    // Grid-based Centroid Clustering for lower zoom levels
    const threshold = 180 / (256 * Math.pow(2, zoom)) * 42;
    const clusters = [];

    allPins.forEach((pin) => {
      if (!pin.latitude || !pin.longitude) return;
      const weight = Math.max(1, pin.reportCount || 1);

      let matchedCluster = null;
      for (const cl of clusters) {
        const dLat = Math.abs(cl.centerLat - pin.latitude);
        const dLng = Math.abs(cl.centerLng - pin.longitude);
        if (dLat < threshold && dLng < threshold) {
          matchedCluster = cl;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.pins.push(pin);
        matchedCluster.totalWeight += weight;
        matchedCluster.weightedLatSum += pin.latitude * weight;
        matchedCluster.weightedLngSum += pin.longitude * weight;
        matchedCluster.centerLat = matchedCluster.weightedLatSum / matchedCluster.totalWeight;
        matchedCluster.centerLng = matchedCluster.weightedLngSum / matchedCluster.totalWeight;
      } else {
        clusters.push({
          pins: [pin],
          totalWeight: weight,
          weightedLatSum: pin.latitude * weight,
          weightedLngSum: pin.longitude * weight,
          centerLat: pin.latitude,
          centerLng: pin.longitude
        });
      }
    });

    clusters.forEach((cl, idx) => {
      if (cl.pins.length === 1) {
        this.createSinglePinMarker(cl.pins[0]);
      } else {
        this.createClusterMarker(cl, `cluster-${idx}`);
      }
    });
  }

  createSinglePinMarker(pin) {
    const reportCount = pin.reportCount || 1;
    const upvotes = pin.upvotes || 0;
    const photoCount = Array.isArray(pin.images) ? pin.images.length : (pin.imageUrl ? 1 : 0);
    const isSevere = reportCount >= 5 || upvotes >= 5 || photoCount >= 5;
    const isMedium = (reportCount >= 2 || upvotes >= 2 || photoCount >= 2) && !isSevere;

    const orbTierClass = isSevere ? 'pin-tier-3' : isMedium ? 'pin-tier-2' : 'pin-tier-1';
    const orbSize = isSevere ? 28 : (isMedium ? 24 : 18);
    const badgeCount = Math.max(reportCount, photoCount);

    const iconHtml = `
      <div class="pin-scale-wrapper">
        <div class="civic-pin ${orbTierClass}" style="width: ${orbSize}px; height: ${orbSize}px;" title="${pin.landmark || 'Hazard'}">
          ${badgeCount > 1 ? `<span class="tabular-nums">${badgeCount}</span>` : ''}
        </div>
      </div>
    `;

    const clickHandler = () => {
      if (this.isGestureActive || Date.now() - this.lastGestureEndTime < 300) return;
      if (this.onPinClickCallback) {
        this.onPinClickCallback(pin);
      }
    };

    const marker = new HTMLMarkerOverlay(
      this.map,
      { lat: pin.latitude, lng: pin.longitude },
      iconHtml,
      clickHandler
    );

    this.markersMap.set(pin.id, marker);
  }

  createClusterMarker(cl, id) {
    const count = cl.pins.reduce((sum, p) => sum + (p.reportCount || 1), 0);
    const iconHtml = `
      <div class="pin-scale-wrapper">
        <div class="custom-cluster-civic" style="cursor: pointer;">
          <span>${count}</span>
        </div>
      </div>
    `;

    const clickHandler = () => {
      if (this.isGestureActive || Date.now() - this.lastGestureEndTime < 300) return;
      this.setView(cl.centerLat, cl.centerLng, (this.map.getZoom() || 5) + 3);
    };

    const marker = new HTMLMarkerOverlay(
      this.map,
      { lat: cl.centerLat, lng: cl.centerLng },
      iconHtml,
      clickHandler
    );

    this.markersMap.set(id, marker);
  }

  setUserLocationMarker(lat, lng) {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setPosition({ lat, lng });
    } else {
      const htmlContent = `
        <div class="user-live-gps-dot relative flex flex-col items-center justify-center pointer-events-none select-none transform -translate-x-1/2 -translate-y-1/2" style="z-index: 999990;">
          <div class="mb-1 px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-full bg-cyan-400 text-slate-950 shadow-md border border-white whitespace-nowrap leading-none flex items-center justify-center">
            YOU
          </div>
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
            <div class="absolute w-5 h-5 bg-cyan-400/40 rounded-full animate-pulse"></div>
            <div class="relative w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-xl"></div>
          </div>
        </div>
      `;

      this.userMarker = new HTMLMarkerOverlay(
        this.map,
        { lat, lng },
        htmlContent,
        null,
        999990,
        'floatPane'
      );
    }
  }

  setAccuracyCircle(lat, lng, radius = 20000) {
    if (!this.map || !window.google || !window.google.maps) return;
    this.clearAccuracyCircle();
    this.accuracyCircle = new google.maps.Circle({
      strokeColor: '#DC2626',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#DC2626',
      fillOpacity: 0.08,
      map: this.map,
      center: { lat, lng },
      radius: radius,
      zIndex: 50
    });
  }

  clearAccuracyCircle() {
    if (this.accuracyCircle) {
      this.accuracyCircle.setMap(null);
      this.accuracyCircle = null;
    }
  }

  setConfirmLocationMarker(lat, lng, onPositionChange) {
    this.clearConfirmLocationMarker();
    if (!this.map || !window.google || !window.google.maps) return;

    // Pulsing / Blinking aura overlay behind the manual draggable pin
    const pulseHtml = `
      <div class="confirm-pin-pulse-dot relative flex items-center justify-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
        <div class="absolute w-12 h-12 bg-red-500 rounded-full animate-ping opacity-75"></div>
        <div class="absolute w-8 h-8 bg-red-500/40 rounded-full animate-pulse"></div>
      </div>
    `;

    this.confirmPulseOverlay = new HTMLMarkerOverlay(
      this.map,
      { lat, lng },
      pulseHtml,
      null,
      999998
    );

    const pinSvg = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: '#DC2626',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 1.8,
      anchor: new google.maps.Point(12, 22)
    };

    this.confirmMarker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      draggable: true,
      icon: pinSvg,
      zIndex: 999999,
      animation: google.maps.Animation.DROP,
      title: 'गड्ढे का स्थान (ड्रैग करें)'
    });

    const notifyPos = (isDragEnd = false) => {
      const pos = this.confirmMarker?.getPosition();
      if (pos) {
        const coords = { lat: pos.lat(), lng: pos.lng() };
        if (this.confirmPulseOverlay) {
          this.confirmPulseOverlay.setPosition(coords);
        }
        if (onPositionChange) {
          onPositionChange(coords, isDragEnd);
        }
      }
    };

    this.confirmMarker.addListener('drag', () => notifyPos(false));
    this.confirmMarker.addListener('dragend', () => notifyPos(true));

    // Map click jumps draggable pin
    this.confirmMapClickListener = this.map.addListener('click', (e) => {
      if (!e.latLng || !this.confirmMarker) return;
      this.confirmMarker.setPosition(e.latLng);
      this.confirmMarker.setZIndex(999999);
      notifyPos(true);
    });
  }

  setConfirmMarkerPosition(lat, lng) {
    if (this.confirmMarker && window.google && window.google.maps) {
      const pos = new google.maps.LatLng(lat, lng);
      this.confirmMarker.setPosition(pos);
      this.confirmMarker.setZIndex(999999);
      if (this.confirmPulseOverlay) {
        this.confirmPulseOverlay.setPosition(pos);
      }
    }
  }

  getConfirmLocationPosition() {
    if (this.confirmMarker) {
      const pos = this.confirmMarker.getPosition();
      if (pos) {
        return { lat: pos.lat(), lng: pos.lng() };
      }
    }
    return null;
  }

  clearConfirmLocationMarker() {
    if (this.confirmMarker) {
      this.confirmMarker.setMap(null);
      this.confirmMarker = null;
    }
    if (this.confirmPulseOverlay) {
      this.confirmPulseOverlay.setMap(null);
      this.confirmPulseOverlay = null;
    }
    if (this.confirmMapClickListener && window.google && window.google.maps) {
      google.maps.event.removeListener(this.confirmMapClickListener);
      this.confirmMapClickListener = null;
    }
  }

  onMapDrag(onStart, onEnd) {
    if (!this.map) return;
    if (onStart) {
      this.map.addListener('dragstart', onStart);
    }
    if (onEnd) {
      this.map.addListener('dragend', onEnd);
    }
  }

  onCenterChanged(callback) {
    if (!this.map) return;
    this.map.addListener('center_changed', () => {
      const c = this.getCenter();
      callback(c);
    });
    this.map.addListener('idle', () => {
      const c = this.getCenter();
      callback(c);
    });
  }

  onMoveEnd(callback) {
    if (this.map) {
      this.map.addListener('idle', () => {
        callback(this.getBounds());
      });
    }
  }

  getBounds() {
    if (!this.map) return null;
    const b = this.map.getBounds();
    if (!b) return null;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    return {
      minLat: sw.lat(),
      maxLat: ne.lat(),
      minLng: sw.lng(),
      maxLng: ne.lng()
    };
  }

  openPopup(pinId) {
    const marker = this.markersMap.get(pinId);
    if (marker) {
      if (typeof marker.triggerClick === 'function') {
        marker.triggerClick();
      } else if (this.infoWindow) {
        google.maps.event.trigger(marker, 'click');
      }
    }
  }

  closePopup() {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  }

  destroy() {
    if (this.markersMap) {
      this.markersMap.forEach((marker) => marker.setMap(null));
      this.markersMap.clear();
    }
    this.map = null;
  }
}
