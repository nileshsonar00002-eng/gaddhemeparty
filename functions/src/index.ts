import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  calculateHaversineDistance,
  encodeGeohash,
  getGeohashNeighbors,
} from './geo';
import {
  isCoordinateInIndia,
  sanitizeLandmark,
  validateAntiSpamHoneypot,
} from './sanitize';
import {
  validateAntiSpamInTransaction,
  recordAntiSpamInTransaction,
} from './rateLimit';
import { ANTI_SPAM_CONFIG } from './config';
import { getNearestIndianCity } from './cities';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Maximum flags before auto-hiding a pin
const AUTO_HIDE_FLAG_THRESHOLD = 5;

/**
 * Callable Function: submitReport
 * Handles pothole creation with server-side validation, anti-spam transaction, and 20m deduplication.
 */
export const submitReport = onCall(
  {
    cors: true,
    enforceAppCheck: false, // In production, can be set to true when reCAPTCHA is registered
  },
  async (request) => {
    // 1. Verify Authentication (Anonymous Auth or standard)
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Anonymous authentication is required.');
    }

    const uid = request.auth.uid;
    const clientIp = request.rawRequest.ip || '127.0.0.1';
    const data = request.data || {};

    const {
      latitude,
      longitude,
      landmark,
      imageUrl,
      thumbnailUrl,
      website_hp,
      formOpenTime,
    } = data;

    // 2. Validate coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!isCoordinateInIndia(lat, lng)) {
      throw new HttpsError(
        'invalid-argument',
        'Coordinates must be valid numbers located within India territory.'
      );
    }

    // 3. Anti-spam honeypot and dwell time check
    const antiSpam = validateAntiSpamHoneypot(website_hp, Number(formOpenTime), 3);
    if (!antiSpam.valid) {
      throw new HttpsError('permission-denied', antiSpam.reason || 'Anti-spam validation failed.');
    }

    // 4. Sanitize landmark
    const cleanedLandmark = sanitizeLandmark(landmark);

    // 5. Image validation
    if (imageUrl && typeof imageUrl !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid image URL.');
    }

    // Static Indian City Lookup (zero Geocoding API cost)
    const nearestCity = getNearestIndianCity(lat, lng);

    const geohash = encodeGeohash(lat, lng, 7);
    const neighborHashes = getGeohashNeighbors(lat, lng, 7);

    // 6. Query candidate pins for 20m deduplication
    const candidateQuery = await db
      .collection('pins')
      .where('status', '==', 'active')
      .where('geohash', 'in', neighborHashes)
      .get();

    let existingNearbyPin: admin.firestore.DocumentSnapshot | null = null;
    let minDistance = Infinity;

    for (const doc of candidateQuery.docs) {
      const pinData = doc.data();
      const dist = calculateHaversineDistance(
        lat,
        lng,
        pinData.latitude,
        pinData.longitude
      );

      if (dist <= ANTI_SPAM_CONFIG.DUPLICATE_RADIUS_M && dist < minDistance) {
        minDistance = dist;
        existingNearbyPin = doc;
      }
    }

    const nowMs = Date.now();

    // 7. Deduplicate or Create New Pin inside a strict Firestore Transaction
    if (existingNearbyPin) {
      const pinRef = existingNearbyPin.ref;

      await db.runTransaction(async (t) => {
        // Enforce anti-spam quotas and same-pin cooldown
        const validation = await validateAntiSpamInTransaction(
          t,
          db,
          uid,
          clientIp,
          existingNearbyPin.id,
          nowMs
        );

        const freshSnap = await t.get(pinRef);
        if (!freshSnap.exists || freshSnap.data()?.status !== 'active') {
          throw new HttpsError('not-found', 'Target pin was removed or is inactive.');
        }

        const freshData = freshSnap.data() || {};
        const currentReports = Number(freshData.reportCount || 1);

        const updateData: any = {
          reportCount: currentReports + 1,
          lastReportedAt: admin.firestore.FieldValue.serverTimestamp(),
          reporters: admin.firestore.FieldValue.arrayUnion(uid),
        };

        if (imageUrl) {
          updateData.imageUrl = imageUrl;
          updateData.images = admin.firestore.FieldValue.arrayUnion(imageUrl);
        }
        if (thumbnailUrl) {
          updateData.thumbnailUrl = thumbnailUrl;
          updateData.thumbnails = admin.firestore.FieldValue.arrayUnion(thumbnailUrl);
        }

        t.update(pinRef, updateData);

        // Record anti-spam action and TTL
        recordAntiSpamInTransaction(t, db, uid, validation, existingNearbyPin.id, nowMs);
      });

      return {
        success: true,
        deduplicated: true,
        pinId: existingNearbyPin.id,
        distanceMeters: Math.round(minDistance),
        cityNameHindi: existingNearbyPin.data()?.cityNameHindi || nearestCity.nameHindi,
        cityNameEnglish: existingNearbyPin.data()?.cityNameEnglish || nearestCity.nameEnglish,
        message: 'Aapke paas pehle se report kiya hua gaddha mila (20m range). Iski count aur photo add ho gayi hai!',
      };
    }

    // No existing pin within 20m -> Create new pin
    const newPinRef = db.collection('pins').doc();
    const statsRef = db.collection('stats').doc('global');

    await db.runTransaction(async (t) => {
      // Enforce anti-spam quotas
      const validation = await validateAntiSpamInTransaction(
        t,
        db,
        uid,
        clientIp,
        null,
        nowMs
      );

      t.set(newPinRef, {
        id: newPinRef.id,
        latitude: lat,
        longitude: lng,
        geohash,
        landmark: cleanedLandmark,
        cityNameHindi: nearestCity.nameHindi,
        cityNameEnglish: nearestCity.nameEnglish,
        cityState: nearestCity.state,
        imageUrl: imageUrl || null,
        thumbnailUrl: thumbnailUrl || imageUrl || null,
        images: imageUrl ? [imageUrl] : [],
        thumbnails: thumbnailUrl ? [thumbnailUrl] : (imageUrl ? [imageUrl] : []),
        reportCount: 1,
        upvotes: 0,
        flagCount: 0,
        status: 'active',
        createdBy: uid,
        reporters: [uid],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastReportedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update aggregate live stats
      t.set(
        statsRef,
        {
          totalReports: admin.firestore.FieldValue.increment(1),
          activePins: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Record anti-spam action and TTL
      recordAntiSpamInTransaction(t, db, uid, validation, newPinRef.id, nowMs);
    });

    return {
      success: true,
      deduplicated: false,
      pinId: newPinRef.id,
      cityNameHindi: nearestCity.nameHindi,
      cityNameEnglish: nearestCity.nameEnglish,
      message: 'Gaddha safalta se report ho gaya!',
    };
  }
);

/**
 * Callable Function: upvotePin
 * Enforces server-side 300m proximity check, rolling 24h limits, same-pin cooldown, and transaction safety.
 */
export const upvotePin = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Anonymous authentication is required.');
    }

    const uid = request.auth.uid;
    const clientIp = request.rawRequest.ip || '127.0.0.1';
    const { pinId, userLatitude, userLongitude } = request.data || {};

    if (!pinId || typeof pinId !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid pin ID.');
    }

    const pinRef = db.collection('pins').doc(pinId);
    const nowMs = Date.now();

    const result = await db.runTransaction(async (t) => {
      const pinSnap = await t.get(pinRef);
      if (!pinSnap.exists || pinSnap.data()?.status !== 'active') {
        throw new HttpsError('not-found', 'Pin not found or is inactive.');
      }

      const pinData = pinSnap.data() || {};

      // 1. Proximity Check (300m threshold)
      if (userLatitude !== undefined && userLongitude !== undefined) {
        const uLat = Number(userLatitude);
        const uLng = Number(userLongitude);

        if (!isNaN(uLat) && !isNaN(uLng) && isCoordinateInIndia(uLat, uLng)) {
          const distanceMeters = calculateHaversineDistance(
            uLat,
            uLng,
            pinData.latitude,
            pinData.longitude
          );

          if (distanceMeters > ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M) {
            const messageHindi = `आप इस गड्ढे से बहुत दूर हैं (+1 दर्ज करने के लिए ${ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M}m के दायरे में होना जरूरी है)।`;
            throw new HttpsError('failed-precondition', messageHindi, {
              code: 'TOO_FAR',
              distanceMeters: Math.round(distanceMeters),
              maxDistanceMeters: ANTI_SPAM_CONFIG.PROXIMITY_UPVOTE_RADIUS_M,
              messageHindi,
            });
          }
        }
      }

      // 2. Validate Anti-Spam (User quota, IP quota, and Same-Pin cooldown)
      const validation = await validateAntiSpamInTransaction(
        t,
        db,
        uid,
        clientIp,
        pinId,
        nowMs
      );

      // 3. Atomically increment upvote counter
      t.update(pinRef, {
        upvotes: admin.firestore.FieldValue.increment(1),
        lastReportedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Record anti-spam action in limits/{uid}, ipLimits/{ipHash}, and pins/{pinId}/reporters/{uid}
      recordAntiSpamInTransaction(t, db, uid, validation, pinId, nowMs);

      const currentUpvotes = (pinData.upvotes || 0) + 1;
      return { upvotes: currentUpvotes };
    });

    return {
      success: true,
      pinId,
      upvotes: result.upvotes,
      message: 'Aapka +1 confirm ho gaya!',
    };
  }
);

/**
 * Callable Function: flagPin
 * Flags an abusive or incorrect pin. Auto-hides if unique flags reach threshold.
 */
export const flagPin = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required to flag.');
    }

    const uid = request.auth.uid;
    const { pinId, reason } = request.data || {};

    if (!pinId || typeof pinId !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid pin ID.');
    }

    const cleanedReason = sanitizeLandmark(reason || 'Reported as invalid or spam');
    const pinRef = db.collection('pins').doc(pinId);
    const flagRef = pinRef.collection('flags').doc(uid);

    const result = await db.runTransaction(async (t) => {
      const pinSnap = await t.get(pinRef);
      if (!pinSnap.exists) {
        throw new HttpsError('not-found', 'Pin does not exist.');
      }

      const flagSnap = await t.get(flagRef);
      if (flagSnap.exists) {
        return { alreadyFlagged: true };
      }

      t.set(flagRef, {
        uid,
        reason: cleanedReason,
        flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const currentFlags = (pinSnap.data()?.flagCount || 0) + 1;
      const updates: Record<string, any> = {
        flagCount: currentFlags,
      };

      if (currentFlags >= AUTO_HIDE_FLAG_THRESHOLD) {
        updates.status = 'hidden';
      }

      t.update(pinRef, updates);

      return {
        alreadyFlagged: false,
        flagCount: currentFlags,
        hidden: currentFlags >= AUTO_HIDE_FLAG_THRESHOLD,
      };
    });

    return {
      success: true,
      pinId,
      ...result,
      message: 'Pin report ho gaya. Review ke liye bheja gaya hai.',
    };
  }
);

/**
 * Callable Function: refreshLeaderboard
 * Aggregates pins by week, month, all-time and city ranks, writing a single document: leaderboard/current
 */
export const refreshLeaderboard = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async () => {
    const pinsSnap = await db
      .collection('pins')
      .where('status', '==', 'active')
      .limit(300)
      .get();

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allPins: any[] = [];
    const cityMap: Record<string, { nameHindi: string; nameEnglish: string; count: number; totalUpvotes: number }> = {};

    pinsSnap.forEach((doc) => {
      const d = doc.data();
      const createdTime = d.createdAt?.toDate ? d.createdAt.toDate().getTime() : now;
      const daysOpen = Math.max(1, Math.floor((now - createdTime) / (24 * 60 * 60 * 1000)));

      const pinItem = {
        id: doc.id,
        latitude: d.latitude,
        longitude: d.longitude,
        landmark: d.landmark || 'Damaged Road',
        cityNameHindi: d.cityNameHindi || 'दिल्ली NCR',
        cityNameEnglish: d.cityNameEnglish || 'Delhi NCR',
        reportCount: Number(d.reportCount || 1),
        upvotes: Number(d.upvotes || 0),
        thumbnailUrl: d.thumbnailUrl || d.imageUrl || '',
        daysOpen,
        createdTime,
      };

      allPins.push(pinItem);

      // Aggregate City stats
      const cKey = pinItem.cityNameHindi;
      if (!cityMap[cKey]) {
        cityMap[cKey] = {
          nameHindi: pinItem.cityNameHindi,
          nameEnglish: pinItem.cityNameEnglish,
          count: 0,
          totalUpvotes: 0,
        };
      }
      cityMap[cKey].count += pinItem.reportCount;
      cityMap[cKey].totalUpvotes += pinItem.upvotes;
    });

    // Sort pins for Week, Month, All-Time
    const weekPins = allPins
      .filter((p) => p.createdTime >= oneWeekAgo)
      .sort((a, b) => (b.reportCount * 2 + b.upvotes) - (a.reportCount * 2 + a.upvotes));

    const monthPins = allPins
      .filter((p) => p.createdTime >= oneMonthAgo)
      .sort((a, b) => (b.reportCount * 2 + b.upvotes) - (a.reportCount * 2 + a.upvotes));

    const allTimePins = [...allPins].sort(
      (a, b) => (b.reportCount * 2 + b.upvotes) - (a.reportCount * 2 + a.upvotes)
    );

    // Top Cities
    const topCities = Object.values(cityMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const leaderboardDoc = {
      heroPotholeOfWeek: weekPins[0] || allTimePins[0] || null,
      weekRankings: weekPins.slice(0, 10),
      monthRankings: monthPins.slice(0, 10),
      allTimeRankings: allTimePins.slice(0, 10),
      topCities,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('leaderboard').doc('current').set(leaderboardDoc);

    return {
      success: true,
      leaderboard: leaderboardDoc,
    };
  }
);
