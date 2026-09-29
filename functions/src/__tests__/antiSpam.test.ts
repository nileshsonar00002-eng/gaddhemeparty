import { describe, it, expect, vi } from 'vitest';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

import {
  hashIpAddress,
  validateAntiSpamInTransaction,
  recordAntiSpamInTransaction,
} from '../rateLimit';
import { ANTI_SPAM_CONFIG } from '../config';
import { calculateHaversineDistance } from '../geo';

describe('Server-Side Anti-Spam Limits & Rules', () => {
  const mockUid = 'user_test_123';
  const mockIp = '103.45.67.89';
  const mockPinId = 'pin_delhi_999';

  it('Rule 5: Hashed IP - hashes with salt and never exposes raw IP', () => {
    const hash1 = hashIpAddress(mockIp);
    const hash2 = hashIpAddress(mockIp);
    const hashOther = hashIpAddress('103.45.67.90');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashOther);
    expect(hash1).not.toContain(mockIp);
    expect(hash1.length).toBe(32);
  });

  it('Rule 6: Proximity for +1 - validates distance threshold (300m)', () => {
    // Connaught Place, New Delhi coordinates
    const pinLat = 28.6315;
    const pinLng = 77.2167;

    // User is ~50m away
    const userLatClose = 28.6318;
    const userLngClose = 77.2170;
    const distClose = calculateHaversineDistance(userLatClose, userLngClose, pinLat, pinLng);
    expect(distClose).toBeLessThanOrEqual(ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M);

    // User is ~450m away
    const userLatFar = 28.6355;
    const userLngFar = 77.2190;
    const distFar = calculateHaversineDistance(userLatFar, userLngFar, pinLat, pinLng);
    expect(distFar).toBeGreaterThan(ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M);
  });

  it('Rule 2: Per user rolling 24h limit - allows up to 5 actions, rejects 6th action with RATE_LIMITED and countdown', async () => {
    const nowMs = 1700000000000;
    const oneHour = 60 * 60 * 1000;

    // User has already done 5 actions in last 5 hours
    const pastTimestamps = [
      nowMs - 5 * oneHour,
      nowMs - 4 * oneHour,
      nowMs - 3 * oneHour,
      nowMs - 2 * oneHour,
      nowMs - 1 * oneHour,
    ];

    const mockDb: any = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          path: `${colName}/${docId}`,
          collection: (subCol: string) => ({
            doc: (subDocId: string) => ({ id: subDocId, path: `${colName}/${docId}/${subCol}/${subDocId}` }),
          }),
        }),
      }),
    };

    const mockTransaction: any = {
      get: vi.fn(async (docRef: any) => {
        if (docRef.id === mockUid) {
          return {
            exists: true,
            data: () => ({ timestamps: pastTimestamps }),
          };
        }
        return {
          exists: false,
          data: () => ({}),
        };
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    // Attempting 6th action
    try {
      await validateAntiSpamInTransaction(
        mockTransaction,
        mockDb,
        mockUid,
        mockIp,
        null,
        nowMs
      );
      expect.fail('Should have thrown RATE_LIMITED error');
    } catch (err: any) {
      expect(err.code).toBe('resource-exhausted');
      expect(err.details?.code).toBe('RATE_LIMITED');
      // Oldest timestamp was 5h ago, so 19 hours remaining in 24h window
      expect(err.details?.waitHours).toBe(19);
      expect(err.details?.messageHindi).toContain('19 घंटे');
    }
  });

  it('Rule 3: Per user per location - rejects 2nd counted action on the same pin within 24h with ALREADY_REPORTED', async () => {
    const nowMs = 1700000000000;
    const mockDb: any = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          path: `${colName}/${docId}`,
          collection: (subCol: string) => ({
            doc: (subId: string) => ({ id: subId, path: `${colName}/${docId}/${subCol}/${subId}` }),
          }),
        }),
      }),
    };

    const mockTransaction: any = {
      get: vi.fn(async (ref: any) => {
        if (ref.id === mockUid) {
          return {
            exists: true,
            data: () => ({
              timestamps: [nowMs - 2 * 60 * 60 * 1000],
              lastCountedAt: nowMs - 2 * 60 * 60 * 1000,
            }),
          };
        }
        return { exists: false, data: () => ({}) };
      }),
      set: vi.fn(),
    };

    try {
      await validateAntiSpamInTransaction(
        mockTransaction,
        mockDb,
        mockUid,
        mockIp,
        mockPinId,
        nowMs
      );
      expect.fail('Should have thrown ALREADY_REPORTED error');
    } catch (err: any) {
      expect(err.code).toBe('already-exists');
      expect(err.details?.code).toBe('ALREADY_REPORTED');
      expect(err.details?.messageHindi).toBe('आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।');
    }
  });

  it('Rule 2 & 10: Rolling window expiration - action is allowed again once oldest timestamp passes 24h', async () => {
    const nowMs = 1700000000000;
    const oneHour = 60 * 60 * 1000;

    // 5 past timestamps, but the oldest one happened 25 hours ago (>24h window)
    const pastTimestamps = [
      nowMs - 25 * oneHour, // Expired!
      nowMs - 4 * oneHour,
      nowMs - 3 * oneHour,
      nowMs - 2 * oneHour,
      nowMs - 1 * oneHour,
    ];

    const mockDb: any = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          path: `${colName}/${docId}`,
          collection: (subCol: string) => ({
            doc: (subDocId: string) => ({ id: subDocId, path: `${colName}/${docId}/${subCol}/${subDocId}` }),
          }),
        }),
      }),
    };

    const mockTransaction: any = {
      get: vi.fn(async (docRef: any) => {
        if (docRef.id === mockUid) {
          return {
            exists: true,
            data: () => ({ timestamps: pastTimestamps }),
          };
        }
        return { exists: false, data: () => ({}) };
      }),
      set: vi.fn(),
    };

    const result = await validateAntiSpamInTransaction(
      mockTransaction,
      mockDb,
      mockUid,
      mockIp,
      null,
      nowMs
    );

    // Filtered active timestamps should be 4 (since oldest expired), allowing the 5th action
    expect(result.userTimestamps.length).toBe(4);
    expect(result.ipHash).toBe(hashIpAddress(mockIp));
  });

  it('Rule 5: Per IP limit - rejects when IP exceeds 30 actions in 24h with IP_RATE_LIMITED', async () => {
    const nowMs = 1700000000000;
    const thirtyTimestamps = Array.from({ length: 30 }, (_, i) => nowMs - (i + 1) * 1000 * 60);

    const mockDb: any = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          path: `${colName}/${docId}`,
          collection: (subCol: string) => ({
            doc: (subDocId: string) => ({ id: subDocId, path: `${colName}/${docId}/${subCol}/${subDocId}` }),
          }),
        }),
      }),
    };

    const mockTransaction: any = {
      get: vi.fn(async (docRef: any) => {
        if (docRef.id === hashIpAddress(mockIp)) {
          return {
            exists: true,
            data: () => ({ timestamps: thirtyTimestamps }),
          };
        }
        return { exists: false, data: () => ({}) };
      }),
      set: vi.fn(),
    };

    try {
      await validateAntiSpamInTransaction(
        mockTransaction,
        mockDb,
        mockUid,
        mockIp,
        null,
        nowMs
      );
      expect.fail('Should have thrown IP_RATE_LIMITED');
    } catch (err: any) {
      expect(err.code).toBe('resource-exhausted');
      expect(err.details?.code).toBe('IP_RATE_LIMITED');
    }
  });

  it('Rule 10: Atomic Transaction updates - records action with expireAt for Firestore TTL', () => {
    const nowMs = 1700000000000;
    const mockDb: any = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          path: `${colName}/${docId}`,
          collection: (subCol: string) => ({
            doc: (subDocId: string) => ({ id: subDocId, path: `${colName}/${docId}/${subCol}/${subDocId}` }),
          }),
        }),
      }),
    };

    const setCalls: any[] = [];
    const mockTransaction: any = {
      set: vi.fn((ref, data, opts) => {
        setCalls.push({ ref, data, opts });
      }),
    };

    const validation = {
      ipHash: hashIpAddress(mockIp),
      userTimestamps: [nowMs - 10000],
      ipTimestamps: [nowMs - 10000],
    };

    recordAntiSpamInTransaction(
      mockTransaction,
      mockDb,
      mockUid,
      validation,
      mockPinId,
      nowMs
    );

    // Must update limits/{uid}, ipLimits/{ipHash}, and pins/{pinId}/reporters/{uid}
    expect(setCalls.length).toBe(3);

    const userCall = setCalls.find((c) => c.ref.id === mockUid && c.ref.path.startsWith('limits'));
    expect(userCall).toBeDefined();
    expect(userCall.data.timestamps.length).toBe(2);
    expect(userCall.data.expireAt).toBeDefined();

    const ipCall = setCalls.find((c) => c.ref.id === validation.ipHash);
    expect(ipCall).toBeDefined();
    expect(ipCall.data.timestamps.length).toBe(2);
    expect(ipCall.data.expireAt).toBeDefined();

    const reporterCall = setCalls.find((c) => c.ref.id === mockUid && c.ref.path.includes('reporters'));
    expect(reporterCall).toBeDefined();
    expect(reporterCall.data.pinId).toBe(mockPinId);
  });
});
