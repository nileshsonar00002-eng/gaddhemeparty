/**
 * Robust Geolocation Manager for Gaddhe Me Party
 * Manages location caching, background tracking, instant acquisition, and permission states
 */

const STORAGE_KEY = 'khadda_cached_location';
let inMemoryCoords = null;
let activeLocationPromise = null;

// Initialize from localStorage / sessionStorage cache
try {
  const cached = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    // Cache valid for up to 12 hours
    if (parsed && parsed.lat && parsed.lng && (Date.now() - (parsed.timestamp || 0)) < 12 * 60 * 60 * 1000) {
      inMemoryCoords = {
        lat: Number(parsed.lat),
        lng: Number(parsed.lng),
        accuracy: parsed.accuracy || 25,
        isCached: true,
        timestamp: parsed.timestamp
      };
    }
  }
} catch (e) {
  console.warn('[Geo] Cache read warning:', e);
}

/**
 * Get current in-memory cached coordinates synchronously
 */
export function getCachedUserLocation() {
  return inMemoryCoords;
}

/**
 * Save coordinates into memory and storage
 */
export function setCachedUserLocation(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
  inMemoryCoords = {
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy || 15,
    isCached: false,
    timestamp: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCoords));
  } catch (e) {}
}

/**
 * Request accurate live geolocation
 * Returns Promise<{ lat: number, lng: number, accuracy: number }>
 */
export async function getLiveUserLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 12000,
    maximumAge = 60000,
    fallbackToCache = true
  } = options;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (fallbackToCache && inMemoryCoords) return inMemoryCoords;
    throw new Error('Geolocation unsupported');
  }

  // If a request is already running, return it
  if (activeLocationPromise) {
    return activeLocationPromise;
  }

  activeLocationPromise = new Promise((resolve, reject) => {
    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        activeLocationPromise = null;
        if (fallbackToCache && inMemoryCoords) {
          console.log('[Geo] Timeout reached, using cached position:', inMemoryCoords);
          resolve(inMemoryCoords);
        } else {
          reject(new Error('Geolocation timeout'));
        }
      }
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        activeLocationPromise = null;

        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 10,
          isCached: false,
          timestamp: Date.now()
        };

        setCachedUserLocation(coords);
        resolve(coords);
      },
      (err) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        activeLocationPromise = null;
        console.warn('[Geo] getCurrentPosition failed:', err.message);

        if (fallbackToCache && inMemoryCoords) {
          console.log('[Geo] Fallback to cached position:', inMemoryCoords);
          resolve(inMemoryCoords);
        } else {
          reject(err);
        }
      },
      {
        enableHighAccuracy,
        timeout: timeout - 500,
        maximumAge
      }
    );
  });

  return activeLocationPromise;
}

/**
 * Check if permission is already granted
 */
export async function checkLocationPermission() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state; // 'granted' | 'prompt' | 'denied'
    }
  } catch (e) {}
  return 'unknown';
}
