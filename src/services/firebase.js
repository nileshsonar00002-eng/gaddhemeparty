import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  connectStorageEmulator
} from 'firebase/storage';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from 'firebase/functions';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  CustomProvider
} from 'firebase/app-check';
import { reverseGeocodeLocation, getNearestIndianCity, haversineDistanceMeters } from '../utils/cities';
import { getActionQuota, hasUserReportedOrUpvoted, hasUserUpvoted, markPinAsUpvoted, recordLocalCountedAction } from '../utils/upvoteStorage';
import { t } from '../utils/i18n';

// Read config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyFakeKeyForLocalDevAndDemo12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'khaddawaliparty.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'khaddawaliparty',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'khaddawaliparty.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF1234'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect Emulators if configured
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('[Firebase] Connecting to local Emulators...');
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Initialize App Check (reCAPTCHA Enterprise / v3 or debug in dev)
const appCheckSiteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY;
if (appCheckSiteKey && typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase] App Check initialized with reCAPTCHA v3');
  } catch (e) {
    console.warn('[Firebase] App Check initialization skipped:', e);
  }
}

// Anonymous Auth Auto-Login
let currentUser = null;
let isCloudFunctionsAvailable = false;
let lastCloudFunctionsAttemptTime = Date.now();

export function initAnonymousAuth() {
  const existing = getCurrentUser();
  if (existing) {
    return Promise.resolve(existing);
  }
  return new Promise((resolve) => {
    if (auth.currentUser) {
      currentUser = auth.currentUser;
      return resolve(auth.currentUser);
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        currentUser = user;
        console.log('[Auth] Anonymous session ready:', user.uid);
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          console.log('[Auth] New anonymous sign-in:', cred.user.uid);
          resolve(cred.user);
        } catch (error) {
          console.warn('[Auth] Anonymous sign-in warning:', error);
          // Return mock user fallback for local offline testing
          currentUser = { uid: 'anon_' + Math.random().toString(36).substring(2, 10), isAnonymous: true };
          resolve(currentUser);
        }
      }
    });
  });
}

export function getCurrentUser() {
  return currentUser || auth.currentUser;
}

/**
 * Upload compressed image to Firebase Storage
 */
export async function uploadPotholePhoto(uid, blob, isThumb = false) {
  try {
    if (!uid) {
      const current = getCurrentUser();
      if (current?.uid) {
        uid = current.uid;
      } else {
        try {
          const user = await Promise.race([
            initAnonymousAuth(),
            new Promise((resolve) => setTimeout(() => resolve(null), 1000))
          ]);
          uid = user?.uid || ('anon_' + Math.random().toString(36).substring(2, 10));
        } catch (_) {
          uid = 'anon_' + Math.random().toString(36).substring(2, 10);
        }
      }
    }
    const timestamp = Date.now();
    const suffix = isThumb ? '_thumb.webp' : '.webp';
    const fileName = `pothole_${timestamp}${suffix}`;
    const fileRef = ref(storage, `potholes/${uid}/${fileName}`);

    // Fast 2.5-second timeout so Storage latency never stalls the UI
    const uploadPromise = uploadBytes(fileRef, blob, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000'
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 2500)
    );
    await Promise.race([uploadPromise, timeoutPromise]);

    const urlPromise = getDownloadURL(fileRef);
    const urlTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Storage URL timeout')), 1500)
    );
    return await Promise.race([urlPromise, urlTimeout]);
  } catch (err) {
    console.warn('[Firebase Storage] Upload notice (CORS/Rules/Auth):', err.message || err);
    return null;
  }
}

/**
 * Cloud Functions Callables (with Firestore direct fallback)
 */
export async function callSubmitReport(reportPayload) {
  // 1. Strict Quota check (Max 5 actions per rolling 24 hours per user)
  const quota = getActionQuota();
  if (quota.isLimitReached) {
    throw new Error(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }));
  }

  // Geocode location to accurate city / town safely with guaranteed non-undefined fallbacks
  const cityInfo = await reverseGeocodeLocation(reportPayload.latitude, reportPayload.longitude).catch(() => null);
  const safeCityHindi = String(cityInfo?.nameHindi || 'महाराष्ट्र').trim();
  const safeCityEnglish = String(cityInfo?.nameEnglish || 'Maharashtra').trim();
  const safeState = String(cityInfo?.state || 'Maharashtra').trim();
  const safeLandmark = String(reportPayload.landmark || 'Sadak par gaddha').trim().slice(0, 80) || 'Sadak par gaddha';
  const safeLat = typeof reportPayload.latitude === 'number' && !isNaN(reportPayload.latitude) ? reportPayload.latitude : 18.6298;
  const safeLng = typeof reportPayload.longitude === 'number' && !isNaN(reportPayload.longitude) ? reportPayload.longitude : 73.7997;
  const safeImageUrl = reportPayload.imageUrl ? String(reportPayload.imageUrl) : null;
  const safeThumbUrl = reportPayload.thumbnailUrl ? String(reportPayload.thumbnailUrl) : (safeImageUrl || null);
  const safeImages = (safeImageUrl ? [safeImageUrl] : []).filter(Boolean);
  const safeThumbs = (safeThumbUrl ? [safeThumbUrl] : (safeImageUrl ? [safeImageUrl] : [])).filter(Boolean);

  const enrichedPayload = {
    ...reportPayload,
    latitude: safeLat,
    longitude: safeLng,
    landmark: safeLandmark,
    cityNameHindi: safeCityHindi,
    cityNameEnglish: safeCityEnglish,
    cityState: safeState,
    imageUrl: safeImageUrl,
    thumbnailUrl: safeThumbUrl
  };

  // Check if Cloud Functions are reachable or if we should skip the timeout wait in this session
  const shouldTryCloudFunctions = isCloudFunctionsAvailable && (Date.now() - lastCloudFunctionsAttemptTime > 300000);

  if (shouldTryCloudFunctions) {
    try {
      const submitFn = httpsCallable(functions, 'submitReport');
      // Fast 1.0s race timeout so un-deployed or slow Cloud Functions don't freeze the UI
      const fnPromise = submitFn(enrichedPayload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud Functions timeout')), 1000)
      );
      const result = await Promise.race([fnPromise, timeoutPromise]);
      const data = result.data || {};
      isCloudFunctionsAvailable = true;
      recordLocalCountedAction(data.pinId || result.data?.id || ('pin_' + Date.now()));
      return {
        ...data,
        cityNameHindi: data?.cityNameHindi || safeCityHindi,
        cityNameEnglish: data?.cityNameEnglish || safeCityEnglish
      };
    } catch (fnErr) {
      console.warn('[Cloud Functions] submitReport error / timeout fallback:', fnErr.message || fnErr);
      const serverMessage = fnErr.details?.messageHindi || fnErr.message;
      if (fnErr.details?.code === 'RATE_LIMITED' || fnErr.details?.code === 'ALREADY_REPORTED' || fnErr.details?.code === 'IP_RATE_LIMITED') {
        throw new Error(serverMessage);
      }
      
      // Mark Cloud Functions as temporarily unavailable so subsequent calls don't wait
      isCloudFunctionsAvailable = false;
      lastCloudFunctionsAttemptTime = Date.now();
    }
  }

  // Direct Firestore write fallback for local offline / demo
  const currentQuota = getActionQuota();
  if (currentQuota.isLimitReached) {
    throw new Error(t('nextReportAvailable', { time: currentQuota.waitFormatted || '24 घंटे' }));
  }

  const user = getCurrentUser();
  const pinsRef = collection(db, 'pins');

  // Check for nearby existing active pin within 5 meters
  let existingPinDoc = null;
  try {
    const q = query(pinsRef, where('status', '==', 'active'), limit(60));
    const fetchPromise = getDocs(q);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Dedup query timeout')), 1000)
    );
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      if (d.latitude && d.longitude) {
        const dist = haversineDistanceMeters(safeLat, safeLng, d.latitude, d.longitude);
        if (dist <= 5) {
          existingPinDoc = { id: docSnap.id, ref: docSnap.ref, data: d };
          break;
        }
      }
    }
  } catch (e) {
    console.warn('Nearby deduplication scan notice:', e);
  }

  if (existingPinDoc) {
    // Merge report and image into existing pin
    const existingImages = (Array.isArray(existingPinDoc.data.images)
      ? existingPinDoc.data.images
      : (existingPinDoc.data.imageUrl ? [existingPinDoc.data.imageUrl] : [])
    ).filter(Boolean);

    const existingThumbs = (Array.isArray(existingPinDoc.data.thumbnails)
      ? existingPinDoc.data.thumbnails
      : (existingPinDoc.data.thumbnailUrl ? [existingPinDoc.data.thumbnailUrl] : [])
    ).filter(Boolean);

    if (safeImageUrl) {
      existingImages.unshift(safeImageUrl);
    }
    if (safeThumbUrl) {
      existingThumbs.unshift(safeThumbUrl);
    }

    await updateDoc(existingPinDoc.ref, {
      reportCount: (existingPinDoc.data.reportCount || 1) + 1,
      imageUrl: safeImageUrl || existingPinDoc.data.imageUrl || null,
      thumbnailUrl: safeThumbUrl || existingPinDoc.data.thumbnailUrl || null,
      images: existingImages,
      thumbnails: existingThumbs,
      photoStatus: safeImageUrl ? 'pending' : (existingPinDoc.data.photoStatus || 'approved'),
      photoApproved: false,
      lastReportedAt: serverTimestamp()
    });

    recordLocalCountedAction(existingPinDoc.id);

    return {
      success: true,
      deduplicated: true,
      pinId: existingPinDoc.id,
      cityNameHindi: existingPinDoc.data.cityNameHindi || safeCityHindi,
      cityNameEnglish: existingPinDoc.data.cityNameEnglish || safeCityEnglish,
      images: existingImages,
      thumbnails: existingThumbs,
      message: 'Aapke paas pehle se report kiya hua gaddha mila (5m range). Nayi photo add kar di gayi hai!'
    };
  }

  // Create new pin with images and thumbnails arrays
  const hasPhoto = Boolean(safeImageUrl);
  const newDoc = await addDoc(pinsRef, {
    latitude: safeLat,
    longitude: safeLng,
    landmark: safeLandmark,
    cityNameHindi: safeCityHindi,
    cityNameEnglish: safeCityEnglish,
    cityState: safeState,
    imageUrl: safeImageUrl,
    thumbnailUrl: safeThumbUrl,
    images: safeImages,
    thumbnails: safeThumbs,
    photoStatus: hasPhoto ? 'pending' : 'none',
    photoApproved: false,
    reportCount: 1,
    upvotes: 0,
    flagCount: 0,
    status: 'active',
    createdBy: user?.uid || 'anonymous',
    createdAt: serverTimestamp(),
    lastReportedAt: serverTimestamp()
  });

  recordLocalCountedAction(newDoc.id);

  return {
    success: true,
    deduplicated: false,
    pinId: newDoc.id,
    cityNameHindi: safeCityHindi,
    cityNameEnglish: safeCityEnglish,
    images: safeImages,
    message: 'Gaddha safalta se report ho gaya!'
  };
}

export async function callUpvotePin(pinId, userCoords = null) {
  if (!pinId) throw new Error('Invalid pin ID');
  const normalizedId = String(pinId).trim();

  // 1. Client-side fast local checks (synchronous before any await)
  if (hasUserReportedOrUpvoted(normalizedId)) {
    throw new Error('आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।');
  }

  const quota = getActionQuota();
  if (quota.isLimitReached) {
    throw new Error(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }));
  }

  // Record locally IMMEDIATELY before any network await so rapid repeat clicks are blocked!
  recordLocalCountedAction(normalizedId);

  const payload = {
    pinId: normalizedId,
    userLatitude: userCoords?.latitude,
    userLongitude: userCoords?.longitude,
  };

  try {
    const upvoteFn = httpsCallable(functions, 'upvotePin');
    const result = await upvoteFn(payload);
    return result.data;
  } catch (fnErr) {
    console.warn('[Cloud Functions] upvotePin notice:', fnErr);
    const serverMessage = fnErr.details?.messageHindi || fnErr.message;
    if (fnErr.details?.code) {
      throw new Error(serverMessage);
    }

    try {
      const user = getCurrentUser();
      const uid = user?.uid || 'anon';
      const pinRef = doc(db, 'pins', normalizedId);
      const snap = await getDocs(query(collection(db, 'pins'), where('__name__', '==', normalizedId)));
      if (!snap.empty) {
        const d = snap.docs[0].data();
        const existingVoters = Array.isArray(d.upvotedBy) ? d.upvotedBy : [];
        const existingReporters = Array.isArray(d.reporters) ? d.reporters : [];
        if (uid !== 'anon' && (existingVoters.includes(uid) || existingReporters.includes(uid) || d.createdBy === uid)) {
          return {
            success: true,
            alreadyVoted: true,
            pinId: normalizedId,
            upvotes: d.upvotes || 0,
            message: 'आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।'
          };
        }
        const newUpvotes = (d.upvotes || 0) + 1;
        await updateDoc(pinRef, {
          upvotes: newUpvotes,
          upvotedBy: uid !== 'anon' ? [...existingVoters, uid] : existingVoters,
          lastReportedAt: serverTimestamp()
        });
        return { success: true, pinId: normalizedId, upvotes: newUpvotes, message: 'Aapka +1 record ho gaya!' };
      }
      return { success: true, pinId: normalizedId, message: 'Aapka +1 record ho gaya!' };
    } catch (err) {
      return { success: true, pinId: normalizedId, message: 'Aapka +1 record ho gaya!' };
    }
  }
}

export async function attachPhotoToPin(pinId, imageUrl, thumbnailUrl) {
  try {
    const pinRef = doc(db, 'pins', pinId);
    const snap = await getDocs(query(collection(db, 'pins'), where('__name__', '==', pinId)));
    let currentImages = [];
    let currentThumbs = [];
    if (!snap.empty) {
      const d = snap.docs[0].data();
      currentImages = Array.isArray(d.images) ? [...d.images] : (d.imageUrl ? [d.imageUrl] : []);
      currentThumbs = Array.isArray(d.thumbnails) ? [...d.thumbnails] : (d.thumbnailUrl ? [d.thumbnailUrl] : []);
    }
    if (imageUrl) currentImages.unshift(imageUrl);
    if (thumbnailUrl) currentThumbs.unshift(thumbnailUrl);

    await updateDoc(pinRef, {
      images: currentImages,
      thumbnails: currentThumbs,
      imageUrl: imageUrl || null,
      thumbnailUrl: thumbnailUrl || imageUrl || null,
      photoStatus: 'pending',
      photoApproved: false,
      lastReportedAt: serverTimestamp()
    });
    return { success: true, images: currentImages };
  } catch (err) {
    console.warn('attachPhotoToPin fallback:', err);
    return { success: false, error: err.message };
  }
}

export async function callFlagPin(pinId, reason) {
  try {
    const flagFn = httpsCallable(functions, 'flagPin');
    const result = await flagFn({ pinId, reason });
    return result.data;
  } catch (fnErr) {
    console.warn('[Cloud Functions] flagPin fallback:', fnErr.message);
    return { success: true, pinId, message: 'Pin review ke liye flag ho gaya.' };
  }
}

/**
 * Real-time active pothole pins listener (Cost protected, limited to 200 most recent active pins)
 */
export function subscribeToActivePins(onPinsUpdated, onError) {
  try {
    const pinsRef = collection(db, 'pins');
    const q = query(
      pinsRef,
      where('status', '==', 'active'),
      limit(200)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const pins = [];
        snapshot.forEach((doc) => {
          pins.push({ id: doc.id, ...doc.data() });
        });
        onPinsUpdated(pins);
      },
      (error) => {
        console.warn('[Firestore] Pins query fallback / offline:', error.message);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.warn('[Firestore] Subscription failed:', e);
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time listener for global stats counter
 */
export function subscribeToGlobalStats(onStatsUpdated) {
  try {
    const statsDoc = doc(db, 'stats', 'global');
    return onSnapshot(statsDoc, (snap) => {
      if (snap.exists()) {
        onStatsUpdated(snap.data());
      }
    });
  } catch (e) {
    return () => {};
  }
}

/**
 * Real-time listener for server-aggregated Leaderboard document
 */
export function subscribeToLeaderboard(onLeaderboardUpdated, onError) {
  try {
    const lbDoc = doc(db, 'leaderboard', 'current');
    return onSnapshot(
      lbDoc,
      (snap) => {
        if (snap.exists()) {
          onLeaderboardUpdated(snap.data());
        } else {
          if (onError) onError(new Error('Leaderboard document not found'));
        }
      },
      (err) => {
        console.warn('[Firestore] Leaderboard sync notice:', err.message);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

export async function callRefreshLeaderboard() {
  try {
    const refreshFn = httpsCallable(functions, 'refreshLeaderboard');
    const result = await refreshFn();
    return result.data;
  } catch (e) {
    console.warn('[Cloud Functions] refreshLeaderboard error:', e);
    return null;
  }
}

/**
 * Check if a pin's photo is approved for public viewing
 */
export function isPinPhotoApproved(pin) {
  if (!pin) return false;
  // If explicitly approved
  if (pin.photoStatus === 'approved' || pin.photoApproved === true) return true;
  // If explicitly pending or rejected
  if (pin.photoStatus === 'pending' || pin.photoStatus === 'rejected' || pin.photoApproved === false) return false;
  // Legacy pins fallback: if photo exists and no photoStatus set, consider legacy approved
  return Boolean(pin.imageUrl || (Array.isArray(pin.images) && pin.images.length > 0));
}

/**
 * Admin Moderation Actions
 */
export async function approvePinPhoto(pinId) {
  if (!pinId) return false;
  try {
    const pinRef = doc(db, 'pins', pinId);
    await updateDoc(pinRef, {
      photoStatus: 'approved',
      photoApproved: true,
      photoApprovedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('[Admin] Approve photo error:', err);
    throw err;
  }
}

export async function rejectPinPhoto(pinId, reason = 'Photo does not meet guidelines') {
  if (!pinId) return false;
  try {
    const pinRef = doc(db, 'pins', pinId);
    await updateDoc(pinRef, {
      photoStatus: 'rejected',
      photoApproved: false,
      photoRejectedReason: reason,
      photoRejectedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('[Admin] Reject photo error:', err);
    throw err;
  }
}

export async function updatePinLandmark(pinId, landmark) {
  if (!pinId) return false;
  try {
    const pinRef = doc(db, 'pins', pinId);
    await updateDoc(pinRef, {
      landmark: String(landmark || '').trim()
    });
    return true;
  } catch (err) {
    console.error('[Admin] Update landmark error:', err);
    throw err;
  }
}

export async function deleteOrArchivePin(pinId) {
  if (!pinId) return false;
  try {
    const pinRef = doc(db, 'pins', pinId);
    await updateDoc(pinRef, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('[Admin] Archive pin error:', err);
    throw err;
  }
}

/**
 * Real-time listener for Admin Moderation Queue (all pins)
 */
export function subscribeToModerationPins(onPinsUpdated, onError) {
  try {
    const pinsRef = collection(db, 'pins');
    const q = query(pinsRef, limit(500));
    return onSnapshot(
      q,
      (snapshot) => {
        const pins = [];
        snapshot.forEach((d) => {
          pins.push({ id: d.id, ...d.data() });
        });
        onPinsUpdated(pins);
      },
      (err) => {
        console.warn('[Admin] Moderation query notice:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Returns current date string in Indian Standard Time (IST, UTC+05:30), format: YYYY-MM-DD
 */
export function getTodayDateKeyIST() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Record a unique visitor session and new user atomically in Firestore
 */
export async function recordVisitorSession() {
  if (typeof window === 'undefined') return;

  const todayKey = getTodayDateKeyIST();
  const HAS_VISITED_KEY = 'khadda_has_visited_v1';
  const TODAY_NEW_USER_KEY = `khadda_new_user_recorded_${todayKey}`;
  const TODAY_VISITOR_KEY = `khadda_visitor_recorded_${todayKey}`;
  const SESSION_KEY = 'khadda_visitor_recorded_v1';

  let isNewUser = false;
  try {
    if (!localStorage.getItem(HAS_VISITED_KEY)) {
      isNewUser = true;
      localStorage.setItem(HAS_VISITED_KEY, 'true');
      localStorage.setItem('khadda_first_visit_date', todayKey);
    }
  } catch (e) {
    isNewUser = !sessionStorage.getItem('khadda_has_visited_session');
    try { sessionStorage.setItem('khadda_has_visited_session', 'true'); } catch (_) {}
  }

  let shouldRecordNewUserToday = false;
  if (isNewUser) {
    try {
      if (!localStorage.getItem(TODAY_NEW_USER_KEY)) {
        shouldRecordNewUserToday = true;
        localStorage.setItem(TODAY_NEW_USER_KEY, 'true');
      }
    } catch (e) {
      shouldRecordNewUserToday = true;
    }
  }

  let shouldRecordVisitorSession = false;
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      shouldRecordVisitorSession = true;
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  } catch (e) {
    shouldRecordVisitorSession = true;
  }

  let shouldRecordDailyVisitor = false;
  try {
    if (!localStorage.getItem(TODAY_VISITOR_KEY)) {
      shouldRecordDailyVisitor = true;
      localStorage.setItem(TODAY_VISITOR_KEY, 'true');
    }
  } catch (e) {
    shouldRecordDailyVisitor = true;
  }

  if (shouldRecordNewUserToday || shouldRecordVisitorSession || shouldRecordDailyVisitor) {
    try {
      const statsRef = doc(db, 'stats', 'global');
      const updateData = {
        lastVisitorAt: serverTimestamp()
      };
      if (shouldRecordVisitorSession) {
        updateData.visitorCount = increment(1);
      }
      if (shouldRecordNewUserToday) {
        updateData.dailyNewUsers = {
          [todayKey]: increment(1)
        };
      }
      if (shouldRecordDailyVisitor) {
        updateData.dailyVisitors = {
          [todayKey]: increment(1)
        };
      }

      await setDoc(statsRef, updateData, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Visitor count increment notice:', err);
    }
  }
}

export async function recordBellRing() {
  let recorded = false;
  try {
    const statsRef = doc(db, 'stats', 'global');
    await setDoc(statsRef, { bellRings: increment(1) }, { merge: true });
    recorded = true;
  } catch (err) {
    console.warn('[Firebase] Bell ring SDK notice, using atomic REST fallback:', err);
  }

  // Resilient fallback: Firestore REST documents:commit atomic field transform
  if (!recorded) {
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mahareel-2f558';
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            writes: [
              {
                transform: {
                  document: `projects/${projectId}/databases/(default)/documents/stats/global`,
                  fieldTransforms: [
                    {
                      fieldPath: 'bellRings',
                      increment: { integerValue: '1' }
                    }
                  ]
                }
              }
            ]
          })
        }
      );
    } catch (restErr) {
      console.warn('[Firebase] Bell ring REST fallback notice:', restErr);
    }
  }
}

/**
 * Real-time listener for Temple Bell ring counter
 * Combines instant onSnapshot push updates with immediate initial fetch & background poll
 */
export function subscribeToBellRings(onCountUpdated) {
  let isCleanedUp = false;
  let pollTimer = null;

  const fetchDirect = async () => {
    if (isCleanedUp) return;
    try {
      const statsDoc = doc(db, 'stats', 'global');
      const snap = await getDoc(statsDoc);
      if (snap.exists() && typeof snap.data().bellRings === 'number') {
        onCountUpdated(snap.data().bellRings);
        return;
      }
    } catch (_) {}

    // REST fallback if SDK offline
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mahareel-2f558';
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stats/global`);
      if (res.ok) {
        const data = await res.json();
        const rings = Number(data.fields?.bellRings?.integerValue);
        if (!isNaN(rings) && rings > 0) {
          onCountUpdated(rings);
        }
      }
    } catch (_) {}
  };

  // Immediate initial load
  fetchDirect();

  // Background poll every 8s in case socket is throttled
  pollTimer = setInterval(fetchDirect, 8000);

  // Real-time Firestore snapshot listener
  let unsubSnapshot = () => {};
  try {
    const statsDoc = doc(db, 'stats', 'global');
    unsubSnapshot = onSnapshot(
      statsDoc,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.bellRings === 'number') {
            onCountUpdated(data.bellRings);
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Bell rings subscription notice:', err);
      }
    );
  } catch (e) {
    // onSnapshot failed, polling handles it
  }

  return () => {
    isCleanedUp = true;
    if (pollTimer) clearInterval(pollTimer);
    try { unsubSnapshot(); } catch (_) {}
  };
}

/**
 * Read locally tracked deleted/hidden comment IDs (shared across tabs on same browser)
 */
export function getDeletedCommentIdsSet() {
  try {
    const raw = localStorage.getItem('khadda_deleted_comment_ids');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

export function getHiddenCommentIdsSet() {
  try {
    const raw = localStorage.getItem('khadda_hidden_comment_ids');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

/**
 * Deduplicate a list of comments by unique ID and identical text within a short time window.
 * Automatically filters out deleted or hidden comments for public main panel display.
 */
export function deduplicateComments(list, includeHidden = false) {
  if (!Array.isArray(list)) return [];
  const result = [];
  const seenIds = new Set();
  const deletedSet = getDeletedCommentIdsSet();
  const hiddenSet = getHiddenCommentIdsSet();

  for (const c of list) {
    if (!c || !c.text) continue;
    if (c.deleted === true) continue;
    if (c.id && deletedSet.has(c.id)) continue;

    const isHidden = Boolean(c.hidden === true || (c.id && hiddenSet.has(c.id)));
    if (!includeHidden && isHidden) continue;

    const cleanText = String(c.text).trim();
    if (!cleanText) continue;

    // Check unique ID
    if (c.id && seenIds.has(c.id)) continue;

    // Check identical comment text submitted within 60 seconds
    const isDuplicateContent = result.some((existing) => {
      if (existing.id && c.id && existing.id === c.id) return true;
      const sameText = String(existing.text).trim() === cleanText;
      const timeDiff = Math.abs((existing.createdAt || 0) - (c.createdAt || 0));
      return sameText && timeDiff < 60000;
    });

    if (isDuplicateContent) continue;

    if (c.id) seenIds.add(c.id);
    result.push({
      id: c.id,
      text: cleanText,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : (c.createdAt?.toMillis ? c.createdAt.toMillis() : Date.now()),
      userId: c.userId || 'anon',
      hidden: isHidden
    });
  }

  return result.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

/**
 * Fetch comments for a pin (live Firestore source of truth + local cache sync)
 * Ensures comments hidden or deleted in Admin Panel are never shown in Main Panel
 */
export async function fetchPinComments(pinId) {
  if (!pinId) return [];
  const localKey = 'khadda_comments_' + pinId;
  const deletedSet = getDeletedCommentIdsSet();
  const hiddenSet = getHiddenCommentIdsSet();

  let cachedRaw = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) cachedRaw = JSON.parse(raw);
  } catch (e) {}

  try {
    const commentsRef = collection(db, 'pins', pinId, 'comments');
    const q = query(commentsRef, limit(100));
    const [snap, pinSnap] = await Promise.all([
      getDocs(q),
      getDoc(doc(db, 'pins', pinId)).catch(() => null)
    ]);

    const pinData = pinSnap && pinSnap.exists() ? pinSnap.data() : {};
    const remoteDeletedIds = new Set(Array.isArray(pinData.deletedCommentIds) ? pinData.deletedCommentIds : []);
    const remoteHiddenIds = new Set(Array.isArray(pinData.hiddenCommentIds) ? pinData.hiddenCommentIds : []);

    // Sync remote deleted/hidden IDs into local sets so all tabs stay consistent
    if (remoteDeletedIds.size > 0) {
      remoteDeletedIds.forEach((id) => deletedSet.add(id));
      try {
        localStorage.setItem('khadda_deleted_comment_ids', JSON.stringify(Array.from(deletedSet)));
      } catch (e) {}
    }

    const remoteAll = [];
    const remoteIds = new Set();

    snap.forEach((d) => {
      const data = d.data();
      remoteIds.add(d.id);
      if (data.deleted === true || deletedSet.has(d.id) || remoteDeletedIds.has(d.id)) {
        return;
      }
      const isHidden = Boolean(data.hidden === true || hiddenSet.has(d.id) || remoteHiddenIds.has(d.id));
      remoteAll.push({
        id: d.id,
        text: data.text || '',
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
        userId: data.userId || 'anon',
        hidden: isHidden,
        synced: true
      });
    });

    // Also check pinData.userComments if any comments were mirrored on the pin doc
    if (Array.isArray(pinData.userComments)) {
      pinData.userComments.forEach((c) => {
        if (!c || !c.id || remoteIds.has(c.id)) return;
        if (c.deleted === true || deletedSet.has(c.id) || remoteDeletedIds.has(c.id)) return;
        const isHidden = Boolean(c.hidden === true || hiddenSet.has(c.id) || remoteHiddenIds.has(c.id));
        remoteAll.push({
          id: c.id,
          text: c.text || '',
          createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
          userId: c.userId || 'anon',
          hidden: isHidden,
          synced: true
        });
      });
    }

    // Only keep cached items that were created very recently (< 10s ago, pending write)
    // and NOT deleted by admin. Anything older that is missing from Firestore was deleted!
    const now = Date.now();
    const pendingLocal = (Array.isArray(cachedRaw) ? cachedRaw : []).filter((c) => {
      if (!c || !c.id) return false;
      if (deletedSet.has(c.id) || remoteDeletedIds.has(c.id) || c.deleted === true) return false;
      if (remoteIds.has(c.id)) return false;
      // Only retain if not yet marked synced and created within last 10 seconds
      return !c.synced && Math.abs(now - (c.createdAt || 0)) < 10000;
    });

    const allNonDeleted = deduplicateComments([...remoteAll, ...pendingLocal], true);
    try {
      localStorage.setItem(localKey, JSON.stringify(allNonDeleted));
    } catch (e) {}

    // Return only visible (non-hidden, non-deleted) comments for the Main Panel
    return allNonDeleted.filter((c) => !c.hidden);
  } catch (err) {
    console.warn('[Firestore] Comments fetch notice:', err);
  }

  return deduplicateComments(cachedRaw, false);
}

/**
 * Subscribe in real-time to a pin's visible comments for the Main Panel
 * Automatically reacts when Admin hides, unhides, or deletes a comment
 */
export function subscribeToPinComments(pinId, onCommentsUpdated) {
  if (!pinId || typeof onCommentsUpdated !== 'function') return () => {};

  let isCleanedUp = false;
  const triggerRefresh = async () => {
    if (isCleanedUp) return;
    try {
      const visible = await fetchPinComments(pinId);
      if (!isCleanedUp) {
        onCommentsUpdated(visible);
      }
    } catch (e) {}
  };

  let unsubSubcollection = () => {};
  let unsubPinDoc = () => {};

  try {
    const commentsRef = collection(db, 'pins', pinId, 'comments');
    unsubSubcollection = onSnapshot(
      query(commentsRef, limit(100)),
      () => triggerRefresh(),
      () => {}
    );
  } catch (e) {}

  try {
    unsubPinDoc = onSnapshot(
      doc(db, 'pins', pinId),
      () => triggerRefresh(),
      () => {}
    );
  } catch (e) {}

  const handleStorageEvent = (e) => {
    if (
      !e.key ||
      e.key === 'khadda_comments_' + pinId ||
      e.key === 'khadda_deleted_comment_ids' ||
      e.key === 'khadda_hidden_comment_ids'
    ) {
      triggerRefresh();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    isCleanedUp = true;
    try { unsubSubcollection(); } catch (e) {}
    try { unsubPinDoc(); } catch (e) {}
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

/**
 * Add a new comment to a pin
 */
export async function addPinComment(pinId, text) {
  if (!pinId || !text || !text.trim()) return null;
  let user = getCurrentUser();
  if (!user) {
    try {
      user = await initAnonymousAuth();
    } catch (e) {}
  }

  const cleanText = text.trim().slice(0, 50);

  // 1. Generate Firestore doc reference SYNCHRONOUSLY so local ID and Firestore doc ID MATCH EXACTLY!
  const commentsRef = collection(db, 'pins', pinId, 'comments');
  const newDocRef = doc(commentsRef);
  const commentId = newDocRef.id;

  const now = Date.now();
  const newComment = {
    id: commentId,
    text: cleanText,
    createdAt: now,
    userId: user?.uid || 'anon',
    hidden: false,
    synced: false
  };

  // 2. Optimistic Local Cache with deduplication
  const localKey = 'khadda_comments_' + pinId;
  try {
    const raw = localStorage.getItem(localKey);
    const list = raw ? JSON.parse(raw) : [];
    const combined = deduplicateComments([...list, newComment], true);
    localStorage.setItem(localKey, JSON.stringify(combined));
  } catch (e) {}

  // 3. Persist to Firestore subcollection using setDoc with the SAME newDocRef!
  try {
    await setDoc(newDocRef, {
      text: cleanText,
      createdAt: serverTimestamp(),
      userId: user?.uid || 'anon'
    });
    // Mark as synced in localStorage so if deleted later on Firestore, local cache knows it was deleted
    newComment.synced = true;
    try {
      const raw = localStorage.getItem(localKey);
      const list = raw ? JSON.parse(raw) : [];
      const updated = list.map((c) => (c.id === commentId ? { ...c, synced: true } : c));
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}
  } catch (err) {
    console.warn('[Firestore] Comment add error:', err);
  }

  return newComment;
}



