// Self-contained Geohash and Haversine geospatial calculation utilities

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Calculates the great-circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Encodes latitude and longitude into a geohash string.
 * Default precision is 7 (~153m x 153m cell).
 */
export function encodeGeohash(latitude: number, longitude: number, precision = 7): string {
  let isEven = true;
  let latMin = -90.0,
    latMax = 90.0;
  let lngMin = -180.0,
    lngMax = 180.0;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  while (geohash.length < precision) {
    let mid: number;
    if (isEven) {
      mid = (lngMin + lngMax) / 2;
      if (longitude > mid) {
        ch |= 1 << (4 - bit);
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude > mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Decodes geohash to latitude and longitude bounds [minLat, minLng, maxLat, maxLng].
 */
export function decodeGeohashBBox(geohash: string): [number, number, number, number] {
  let isEven = true;
  let latMin = -90.0,
    latMax = 90.0;
  let lngMin = -180.0,
    lngMax = 180.0;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let j = 0; j < 5; j++) {
      const mask = 1 << (4 - j);
      if (isEven) {
        const mid = (lngMin + lngMax) / 2;
        if (cd & mask) {
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (cd & mask) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return [latMin, lngMin, latMax, lngMax];
}

/**
 * Finds the 8 neighboring geohashes plus the center cell.
 */
export function getGeohashNeighbors(latitude: number, longitude: number, precision = 7): string[] {
  const centerHash = encodeGeohash(latitude, longitude, precision);
  const [latMin, lngMin, latMax, lngMax] = decodeGeohashBBox(centerHash);
  const latDelta = latMax - latMin;
  const lngDelta = lngMax - lngMin;

  const hashes = new Set<string>();
  hashes.add(centerHash);

  const latSteps = [-1, 0, 1];
  const lngSteps = [-1, 0, 1];

  for (const dy of latSteps) {
    for (const dx of lngSteps) {
      const neighborLat = latitude + dy * latDelta;
      const neighborLng = longitude + dx * lngDelta;
      hashes.add(encodeGeohash(neighborLat, neighborLng, precision));
    }
  }

  return Array.from(hashes);
}
