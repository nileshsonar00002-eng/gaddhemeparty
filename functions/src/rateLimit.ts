import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { ANTI_SPAM_CONFIG } from './config';

/**
 * Computes a privacy-preserving SHA-256 hash of an IP address.
 * Raw IP addresses are NEVER persisted into database.
 */
export function hashIpAddress(ip: string): string {
  const normalizedIp = (ip || '127.0.0.1').trim().toLowerCase();
  return crypto
    .createHash('sha256')
    .update(`${ANTI_SPAM_CONFIG.IP_SALT}_${normalizedIp}`)
    .digest('hex')
    .substring(0, 32);
}

export interface AntiSpamValidationResult {
  ipHash: string;
  userTimestamps: number[];
  ipTimestamps: number[];
}

/**
 * Validates rolling user and IP limits, and same-pin cooldown inside a Firestore transaction.
 * Throws structured HttpsError if any limit is violated.
 */
export async function validateAntiSpamInTransaction(
  transaction: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  uid: string,
  clientIp: string,
  pinId?: string | null,
  nowMs: number = Date.now()
): Promise<AntiSpamValidationResult> {
  const ipHash = hashIpAddress(clientIp);
  const oneDayAgo = nowMs - 24 * 60 * 60 * 1000;

  const userLimitRef = db.collection('limits').doc(uid);
  const ipLimitRef = db.collection('ipLimits').doc(ipHash);

  // 1. Read User Limit doc
  const userSnap = await transaction.get(userLimitRef);
  const rawUserTimestamps: number[] = userSnap.exists && Array.isArray(userSnap.data()?.timestamps)
    ? userSnap.data()?.timestamps
    : [];
  
  // Filter rolling 24h timestamps
  const userTimestamps = rawUserTimestamps.filter((ts) => typeof ts === 'number' && ts > oneDayAgo);

  // Check User 24h Quota (max 5)
  if (userTimestamps.length >= ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_USER_PER_24H) {
    const oldest = Math.min(...userTimestamps);
    const timeRemainingMs = Math.max(0, oldest + 24 * 60 * 60 * 1000 - nowMs);
    let waitHours = Math.floor(timeRemainingMs / (60 * 60 * 1000));
    let waitMinutes = Math.ceil((timeRemainingMs % (60 * 60 * 1000)) / (60 * 1000));

    if (waitMinutes === 60) {
      waitHours += 1;
      waitMinutes = 0;
    }

    const timeStr =
      waitHours > 0
        ? waitMinutes > 0
          ? `${waitHours} घंटे ${waitMinutes} मिनट`
          : `${waitHours} घंटे`
        : `${waitMinutes} मिनट`;

    const messageHindi = `आपकी अगली रिपोर्ट ${timeStr} बाद हो सकती है।`;

    throw new HttpsError('resource-exhausted', messageHindi, {
      code: 'RATE_LIMITED',
      nextAvailableAt: oldest + 24 * 60 * 60 * 1000,
      waitHours,
      waitMinutes,
      messageHindi,
    });
  }

  // 2. Read IP Limit doc
  const ipSnap = await transaction.get(ipLimitRef);
  const rawIpTimestamps: number[] = ipSnap.exists && Array.isArray(ipSnap.data()?.timestamps)
    ? ipSnap.data()?.timestamps
    : [];

  const ipTimestamps = rawIpTimestamps.filter((ts) => typeof ts === 'number' && ts > oneDayAgo);

  // Check IP 24h Quota (max 30)
  if (ipTimestamps.length >= ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_IP_PER_24H) {
    const messageHindi = 'इस नेटवर्क (IP) से आज की अधिकतम सीमा समाप्त हो चुकी है। कृपया बाद में प्रयास करें।';
    throw new HttpsError('resource-exhausted', messageHindi, {
      code: 'IP_RATE_LIMITED',
      messageHindi,
    });
  }

  // 3. Check Same-Pin Cooldown (if targeting an existing pin)
  if (pinId) {
    const reporterRef = db.collection('pins').doc(pinId).collection('reporters').doc(uid);
    const reporterSnap = await transaction.get(reporterRef);

    if (reporterSnap.exists) {
      const data = reporterSnap.data() || {};
      const lastCountedAt = data.lastCountedAt?.toMillis
        ? data.lastCountedAt.toMillis()
        : typeof data.lastCountedAt === 'number'
        ? data.lastCountedAt
        : 0;

      const cooldownMs = ANTI_SPAM_CONFIG.SAME_PIN_COOLDOWN_HOURS * 60 * 60 * 1000;
      if (nowMs - lastCountedAt < cooldownMs) {
        const messageHindi = 'आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।';
        throw new HttpsError('already-exists', messageHindi, {
          code: 'ALREADY_REPORTED',
          messageHindi,
        });
      }
    }
  }

  return {
    ipHash,
    userTimestamps,
    ipTimestamps,
  };
}

/**
 * Records the counted action into limits/{uid}, ipLimits/{ipHash}, and pins/{pinId}/reporters/{uid}
 * with automatic TTL expireAt fields.
 */
export function recordAntiSpamInTransaction(
  transaction: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  uid: string,
  validation: AntiSpamValidationResult,
  pinId: string,
  nowMs: number = Date.now()
): void {
  const userLimitRef = db.collection('limits').doc(uid);
  const ipLimitRef = db.collection('ipLimits').doc(validation.ipHash);
  const reporterRef = db.collection('pins').doc(pinId).collection('reporters').doc(uid);

  const expireAt = admin.firestore.Timestamp.fromMillis(
    nowMs + ANTI_SPAM_CONFIG.TTL_EXPIRATION_HOURS * 60 * 60 * 1000
  );
  const currentTimestamp = admin.firestore.Timestamp.fromMillis(nowMs);

  const updatedUserTimestamps = [...validation.userTimestamps, nowMs].slice(
    -ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_USER_PER_24H
  );

  const updatedIpTimestamps = [...validation.ipTimestamps, nowMs].slice(
    -ANTI_SPAM_CONFIG.MAX_ACTIONS_PER_IP_PER_24H
  );

  // 1. Update limits/{uid}
  transaction.set(
    userLimitRef,
    {
      uid,
      timestamps: updatedUserTimestamps,
      lastActionAt: currentTimestamp,
      expireAt,
    },
    { merge: true }
  );

  // 2. Update ipLimits/{ipHash}
  transaction.set(
    ipLimitRef,
    {
      ipHash: validation.ipHash,
      timestamps: updatedIpTimestamps,
      lastActionAt: currentTimestamp,
      expireAt,
    },
    { merge: true }
  );

  // 3. Update pins/{pinId}/reporters/{uid}
  transaction.set(
    reporterRef,
    {
      uid,
      pinId,
      lastCountedAt: currentTimestamp,
    },
    { merge: true }
  );
}
