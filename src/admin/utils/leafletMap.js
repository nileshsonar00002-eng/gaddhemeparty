const getL = () => window.L;

const mapInstances = new Map();

export function initMiniMap(elementId, lat, lng) {
  const container = document.getElementById(elementId);
  if (!container) return null;

  // Cleanup old instance if present
  if (mapInstances.has(elementId)) {
    try {
      mapInstances.get(elementId).remove();
    } catch (_) {}
    mapInstances.delete(elementId);
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    container.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-slate-500">Invalid Coords</div>';
    return null;
  }

  try {
    const L = getL();
    if (!L) return null;
    const map = L.map(elementId, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    });

    // Dark styled OpenStreetMap / CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Glowing Hazard Pin Marker
    const icon = L.divIcon({
      className: 'admin-mini-pin',
      html: `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
          <div class="absolute w-6 h-6 bg-amber-500/40 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    L.marker([lat, lng], { icon }).addTo(map);

    mapInstances.set(elementId, map);
    return map;
  } catch (err) {
    console.warn('MiniMap init warning:', err);
    return null;
  }
}

export function cleanupAllMiniMaps() {
  mapInstances.forEach((map) => {
    try {
      map.remove();
    } catch (_) {}
  });
  mapInstances.clear();
}
