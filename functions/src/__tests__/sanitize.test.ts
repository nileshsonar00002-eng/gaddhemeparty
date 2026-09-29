import { describe, it, expect } from 'vitest';
import {
  isCoordinateInIndia,
  sanitizeLandmark,
  validateAntiSpamHoneypot,
  INDIA_BBOX,
} from '../sanitize';

describe('Sanitization & Anti-Spam Validation', () => {
  it('validates coordinates strictly within India bounding box', () => {
    // New Delhi
    expect(isCoordinateInIndia(28.6139, 77.2090)).toBe(true);
    // Mumbai
    expect(isCoordinateInIndia(19.0760, 72.8777)).toBe(true);
    // Chennai
    expect(isCoordinateInIndia(13.0827, 80.2707)).toBe(true);
    // Kolkata
    expect(isCoordinateInIndia(22.5726, 88.3639)).toBe(true);
    // Kanyakumari
    expect(isCoordinateInIndia(8.0883, 77.5385)).toBe(true);

    // Outside India: London
    expect(isCoordinateInIndia(51.5074, -0.1278)).toBe(false);
    // Outside India: New York
    expect(isCoordinateInIndia(40.7128, -74.0060)).toBe(false);
    // Invalid / NaN
    expect(isCoordinateInIndia(NaN, 77.0)).toBe(false);
    expect(isCoordinateInIndia(28.0, undefined as any)).toBe(false);
  });

  it('sanitizes landmark text and removes malicious HTML / script injections', () => {
    const raw = '<script>alert("hack")</script>Near Chai Tapri <img src="x" onerror="alert(1)">';
    const cleaned = sanitizeLandmark(raw);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('<img');
    expect(cleaned).toContain('Near Chai Tapri');
  });

  it('removes URLs to prevent phishing links in landmarks', () => {
    const raw = 'Opposite petrol pump https://spam-phishing.xyz/win';
    const cleaned = sanitizeLandmark(raw);
    expect(cleaned).not.toContain('https://');
    expect(cleaned).toContain('[link removed]');
  });

  it('truncates landmark to maximum 100 characters', () => {
    const longText = 'A'.repeat(150);
    const cleaned = sanitizeLandmark(longText);
    expect(cleaned.length).toBe(100);
  });

  it('rejects honeypot violations and fast automated submissions', () => {
    const now = Date.now();

    // Honeypot filled by bot -> reject
    const botResult = validateAntiSpamHoneypot('http://spam.com', now - 5000);
    expect(botResult.valid).toBe(false);
    expect(botResult.reason).toContain('honeypot');

    // Submitted too quickly (< 3 seconds) -> reject
    const fastResult = validateAntiSpamHoneypot('', now - 1000, 3);
    expect(fastResult.valid).toBe(false);
    expect(fastResult.reason).toContain('rapidly');

    // Legitimate user submission (> 3 seconds dwell time) -> accept
    const legitResult = validateAntiSpamHoneypot('', now - 4500, 3);
    expect(legitResult.valid).toBe(true);
  });
});
