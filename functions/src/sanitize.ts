// Input validation and sanitization for KhaddaWaliParty

export interface IndiaBBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Bounding box strictly encompassing India territory including islands
export const INDIA_BBOX: IndiaBBox = {
  minLat: 6.5,
  maxLat: 37.5,
  minLng: 68.0,
  maxLng: 97.5,
};

/**
 * Validates that latitude and longitude are valid numbers within India.
 */
export function isCoordinateInIndia(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= INDIA_BBOX.minLat &&
    lat <= INDIA_BBOX.maxLat &&
    lng >= INDIA_BBOX.minLng &&
    lng <= INDIA_BBOX.maxLng
  );
}

/**
 * Sanitizes landmark text:
 * - Strips all HTML tags and attributes
 * - Removes URL links (http, https, www, .com, .in, etc.)
 * - Trims whitespace
 * - Truncates to max 100 chars
 */
export function sanitizeLandmark(rawText?: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. Strip HTML tags
  let cleaned = rawText.replace(/<[^>]*>?/gm, '');

  // 2. Strip potential URL patterns
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|in|org|net|xyz|me|io)[^\s]*)/gi, '[link removed]');

  // 3. Remove control characters and non-printable characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

  // 4. Normalize spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 5. Enforce max 100 chars
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 100).trim();
  }

  return cleaned;
}

/**
 * Validates honeypot and minimum dwell time.
 * @param honeypotField Value of invisible honeypot input (must be empty)
 * @param formOpenTimestamp Unix epoch timestamp when client rendered form
 * @param minDwellSeconds Minimum seconds required before submission (e.g. 3s)
 */
export function validateAntiSpamHoneypot(
  honeypotField: unknown,
  formOpenTimestamp: number,
  minDwellSeconds = 3
): { valid: boolean; reason?: string } {
  // Honeypot must be completely empty
  if (honeypotField !== undefined && honeypotField !== null && honeypotField !== '') {
    return { valid: false, reason: 'Spam bot detected via honeypot.' };
  }

  // Check form open timestamp
  const now = Date.now();
  if (!formOpenTimestamp || typeof formOpenTimestamp !== 'number') {
    return { valid: false, reason: 'Invalid form timing.' };
  }

  const elapsedMs = now - formOpenTimestamp;
  if (elapsedMs < minDwellSeconds * 1000) {
    return { valid: false, reason: 'Form submitted too rapidly.' };
  }

  // Reject future timestamps (> 1 minute in future)
  if (formOpenTimestamp > now + 60000) {
    return { valid: false, reason: 'Invalid client timestamp.' };
  }

  return { valid: true };
}
