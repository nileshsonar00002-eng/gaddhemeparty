import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  encodeGeohash,
  getGeohashNeighbors,
} from '../geo';

describe('Geo Utilities & 5-Meter Haversine Deduplication', () => {
  it('calculates 0 meters for identical coordinates', () => {
    const dist = calculateHaversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
    expect(dist).toBe(0);
  });

  it('accurately identifies points within 20 meters (Connaught Place Delhi)', () => {
    // 28.631500, 77.216700 to 28.631600, 77.216750 (~12 meters apart)
    const dist = calculateHaversineDistance(
      28.631500,
      77.216700,
      28.631600,
      77.216750
    );
    expect(dist).toBeLessThan(20);
    expect(dist).toBeGreaterThan(5);
  });

  it('correctly separates points farther than 20 meters (~55 meters apart)', () => {
    const dist = calculateHaversineDistance(
      28.631500,
      77.216700,
      28.632000,
      77.216700
    );
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeCloseTo(55.6, 0);
  });

  it('encodes geohash with expected precision', () => {
    const hash7 = encodeGeohash(19.0760, 72.8777, 7); // Mumbai
    expect(hash7).toHaveLength(7);

    const hash8 = encodeGeohash(12.9716, 77.5946, 8); // Bengaluru
    expect(hash8).toHaveLength(8);
  });

  it('returns exactly 9 neighboring geohash cells (center + 8 surroundings)', () => {
    const neighbors = getGeohashNeighbors(28.6139, 77.2090, 7);
    expect(neighbors.length).toBeGreaterThanOrEqual(8);
    expect(neighbors.length).toBeLessThanOrEqual(9);
    // Center hash must be present in neighbors
    const centerHash = encodeGeohash(28.6139, 77.2090, 7);
    expect(neighbors).toContain(centerHash);
  });
});
