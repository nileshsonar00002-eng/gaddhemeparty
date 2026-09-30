/**
 * Robust Multi-Tier Geolocation Manager for Gaddhe Me Party
 * Tiers:
 * 1. High Accuracy GPS (Device hardware)
 * 2. Standard Accuracy (Wi-Fi / Cell tower triangulation)
 * 3. IP-based Geolocation (Fast public APIs for desktop/laptop fallback)
 * 4. Map Center / Cached Coords Fallback
 */

const STORAGE_KEY = 'khadda_cached_location';
const REAL_GPS_KEY = 'khadda_real_device_gps';
let inMemoryCoords = null;
let inMemoryRealGps = null;
let activeLocationPromise = null;
let defaultFallbackCoords = { lat: 18.5204, lng: 73.8567, accuracy: 100, isFallback: true }; // Default to Maharashtra/Center

// Initialize from localStorage cache
try {
  const cached = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      inMemoryCoords = {
        lat: Number(parsed.lat),
        lng: Number(parsed.lng),
        accuracy: parsed.accuracy || 25,
        isCached: true,
        source: parsed.source || 'cache',
        timestamp: parsed.timestamp || Date.now()
      };
    }
  }
  const cachedGps = localStorage.getItem(REAL_GPS_KEY) || sessionStorage.getItem(REAL_GPS_KEY);
  if (cachedGps) {
    const parsedGps = JSON.parse(cachedGps);
    if (parsedGps && typeof parsedGps.lat === 'number' && typeof parsedGps.lng === 'number') {
      inMemoryRealGps = {
        lat: Number(parsedGps.lat),
        lng: Number(parsedGps.lng),
        accuracy: parsedGps.accuracy || 25,
        source: parsedGps.source || 'gps',
        timestamp: parsedGps.timestamp || Date.now()
      };
    }
  }
} catch (e) {
  console.warn('[Geo] Cache read warning:', e);
}

export function getCachedUserLocation() {
  return inMemoryCoords;
}

export function getRealDeviceGps() {
  return inMemoryRealGps;
}

export function setRealDeviceGps(coords, source = 'hardware_gps') {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
  inMemoryRealGps = {
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy || 15,
    source,
    timestamp: Date.now()
  };
  try {
    localStorage.setItem(REAL_GPS_KEY, JSON.stringify(inMemoryRealGps));
    sessionStorage.setItem(REAL_GPS_KEY, JSON.stringify(inMemoryRealGps));
  } catch (e) {}
}

export function setCachedUserLocation(coords, source = 'user') {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
  inMemoryCoords = {
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy || 15,
    isCached: false,
    source,
    timestamp: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCoords));
  } catch (e) {}
}

export function setDefaultFallbackCoords(coords) {
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    defaultFallbackCoords = {
      lat: coords.lat,
      lng: coords.lng,
      accuracy: 50,
      isFallback: true
    };
  }
}

/**
 * Fast IP-based geolocation fallback for desktop browsers with no hardware GPS
 */
async function fetchIpGeolocation() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const coords = {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 2500, // IP accuracy is city-level (~2.5km)
          city: data.city,
          source: 'ip_geo',
          isIpFallback: true,
          timestamp: Date.now()
        };
        setCachedUserLocation(coords, 'ip_geo');
        return coords;
      }
    }
  } catch (e) {
    // Try secondary endpoint
    try {
      const res2 = await fetch('https://freeipapi.com/api/json');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
          const coords = {
            lat: data2.latitude,
            lng: data2.longitude,
            accuracy: 3000,
            city: data2.cityName,
            source: 'ip_geo',
            isIpFallback: true,
            timestamp: Date.now()
          };
          setCachedUserLocation(coords, 'ip_geo');
          return coords;
        }
      }
    } catch (e2) {}
  }
  return null;
}

/**
 * Primary multi-tier location acquisition
 */
export async function getLiveUserLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 8000,
    maximumAge = 60000,
    fallbackToCache = true
  } = options;

  // If a request is already running, reuse it
  if (activeLocationPromise) {
    return activeLocationPromise;
  }

  activeLocationPromise = (async () => {
    // Tier 1: Try Browser Geolocation (High Accuracy)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const highAccCoords = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('GPS Timeout')), Math.min(timeout, 5000));
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timer);
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy || 10,
                source: 'hardware_gps',
                timestamp: Date.now()
              });
            },
            (err) => {
              clearTimeout(timer);
              reject(err);
            },
            { enableHighAccuracy: true, timeout: Math.min(timeout, 5000), maximumAge }
          );
        });

        setRealDeviceGps(highAccCoords, 'hardware_gps');
        setCachedUserLocation(highAccCoords, 'hardware_gps');
        return highAccCoords;
      } catch (err1) {
        console.log('[Geo] High accuracy GPS skipped, trying standard accuracy:', err1.message);

        // Tier 2: Try Browser Geolocation (Standard Accuracy - Wi-Fi/Cell)
        try {
          const stdCoords = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Wi-Fi Geolocation Timeout')), 4000);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timer);
                resolve({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || 50,
                  source: 'wifi_geo',
                  timestamp: Date.now()
                });
              },
              (err) => {
                clearTimeout(timer);
                reject(err);
              },
              { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
            );
          });

          setRealDeviceGps(stdCoords, 'wifi_geo');
          setCachedUserLocation(stdCoords, 'wifi_geo');
          return stdCoords;
        } catch (err2) {
          console.log('[Geo] Standard geolocation skipped:', err2.message);
        }
      }
    }

    // Tier 3: IP-based Geolocation (Works even when OS location is off)
    try {
      const ipCoords = await fetchIpGeolocation();
      if (ipCoords) {
        setRealDeviceGps(ipCoords, 'ip_geo');
        console.log('[Geo] Resolved via IP Geolocation:', ipCoords);
        return ipCoords;
      }
    } catch (e) {}

    // Tier 4: Cached Coordinates or Map Center Fallback
    if (fallbackToCache && inMemoryCoords) {
      return inMemoryCoords;
    }

    return defaultFallbackCoords;
  })();

  try {
    const res = await activeLocationPromise;
    return res;
  } finally {
    activeLocationPromise = null;
  }
}
