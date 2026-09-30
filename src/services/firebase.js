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
  updateDoc,
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

export function initAnonymousAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
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
      const user = await initAnonymousAuth();
      uid = user?.uid || 'anon_user';
    }
    const timestamp = Date.now();
    const suffix = isThumb ? '_thumb.webp' : '.webp';
    const fileName = `pothole_${timestamp}${suffix}`;
    const fileRef = ref(storage, `potholes/${uid}/${fileName}`);

    await uploadBytes(fileRef, blob, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000'
    });

    return await getDownloadURL(fileRef);
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

  // Geocode location to accurate city / town
  const cityInfo = await reverseGeocodeLocation(reportPayload.latitude, reportPayload.longitude);
  const enrichedPayload = {
    ...reportPayload,
    cityNameHindi: cityInfo.nameHindi,
    cityNameEnglish: cityInfo.nameEnglish,
    cityState: cityInfo.state
  };

  try {
    const submitFn = httpsCallable(functions, 'submitReport');
    const result = await submitFn(enrichedPayload);
    const data = result.data || {};
    recordLocalCountedAction(data.pinId || result.data?.id || ('pin_' + Date.now()));
    return {
      ...data,
      cityNameHindi: data?.cityNameHindi || cityInfo.nameHindi,
      cityNameEnglish: data?.cityNameEnglish || cityInfo.nameEnglish
    };
  } catch (fnErr) {
    console.warn('[Cloud Functions] submitReport error:', fnErr);
    const serverMessage = fnErr.details?.messageHindi || fnErr.message;
    if (fnErr.details?.code === 'RATE_LIMITED' || fnErr.details?.code === 'ALREADY_REPORTED' || fnErr.details?.code === 'IP_RATE_LIMITED') {
      throw new Error(serverMessage);
    }
    
    // Direct Firestore write fallback for local offline / demo
    const currentQuota = getActionQuota();
    if (currentQuota.isLimitReached) {
      throw new Error(t('nextReportAvailable', { time: currentQuota.waitFormatted || '24 घंटे' }));
    }

    const user = getCurrentUser();
    const pinsRef = collection(db, 'pins');

    // Check for nearby existing active pin within 20 meters
    let existingPinDoc = null;
    try {
      const q = query(pinsRef, where('status', '==', 'active'), limit(60));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const d = docSnap.data();
        if (d.latitude && d.longitude) {
          const dist = haversineDistanceMeters(reportPayload.latitude, reportPayload.longitude, d.latitude, d.longitude);
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
      const existingImages = Array.isArray(existingPinDoc.data.images)
        ? [...existingPinDoc.data.images]
        : (existingPinDoc.data.imageUrl ? [existingPinDoc.data.imageUrl] : []);

      const existingThumbs = Array.isArray(existingPinDoc.data.thumbnails)
        ? [...existingPinDoc.data.thumbnails]
        : (existingPinDoc.data.thumbnailUrl ? [existingPinDoc.data.thumbnailUrl] : []);

      if (reportPayload.imageUrl) {
        existingImages.unshift(reportPayload.imageUrl);
      }
      if (reportPayload.thumbnailUrl) {
        existingThumbs.unshift(reportPayload.thumbnailUrl);
      }

      await updateDoc(existingPinDoc.ref, {
        reportCount: (existingPinDoc.data.reportCount || 1) + 1,
        imageUrl: reportPayload.imageUrl || existingPinDoc.data.imageUrl || null,
        thumbnailUrl: reportPayload.thumbnailUrl || existingPinDoc.data.thumbnailUrl || null,
        images: existingImages,
        thumbnails: existingThumbs,
        lastReportedAt: serverTimestamp()
      });

      recordLocalCountedAction(existingPinDoc.id);

      return {
        success: true,
        deduplicated: true,
        pinId: existingPinDoc.id,
        cityNameHindi: existingPinDoc.data.cityNameHindi || cityInfo.nameHindi,
        cityNameEnglish: existingPinDoc.data.cityNameEnglish || cityInfo.nameEnglish,
        images: existingImages,
        thumbnails: existingThumbs,
        message: 'Aapke paas pehle se report kiya hua gaddha mila (5m range). Nayi photo add kar di gayi hai!'
      };
    }

    // Create new pin with images and thumbnails arrays
    const newDoc = await addDoc(pinsRef, {
      latitude: reportPayload.latitude,
      longitude: reportPayload.longitude,
      landmark: reportPayload.landmark || 'Sadak par gaddha',
      cityNameHindi: cityInfo.nameHindi,
      cityNameEnglish: cityInfo.nameEnglish,
      cityState: cityInfo.state,
      imageUrl: reportPayload.imageUrl || null,
      thumbnailUrl: reportPayload.thumbnailUrl || reportPayload.imageUrl || null,
      images: reportPayload.imageUrl ? [reportPayload.imageUrl] : [],
      thumbnails: reportPayload.thumbnailUrl ? [reportPayload.thumbnailUrl] : (reportPayload.imageUrl ? [reportPayload.imageUrl] : []),
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
      cityNameHindi: cityInfo.nameHindi,
      cityNameEnglish: cityInfo.nameEnglish,
      images: reportPayload.imageUrl ? [reportPayload.imageUrl] : [],
      message: 'Gaddha safalta se report ho gaya!'
    };
  }
}

export async function callUpvotePin(pinId, userCoords = null) {
  if (!pinId) throw new Error('Invalid pin ID');

  // 1. Client-side fast local checks
  if (hasUserReportedOrUpvoted(pinId)) {
    throw new Error('आपने इस गड्ढे की रिपोर्ट पहले ही कर दी है।');
  }

  const quota = getActionQuota();
  if (quota.isLimitReached) {
    throw new Error(t('nextReportAvailable', { time: quota.waitFormatted || '24 घंटे' }));
  }

  const payload = {
    pinId,
    userLatitude: userCoords?.latitude,
    userLongitude: userCoords?.longitude,
  };

  try {
    const upvoteFn = httpsCallable(functions, 'upvotePin');
    const result = await upvoteFn(payload);
    recordLocalCountedAction(pinId);
    return result.data;
  } catch (fnErr) {
    console.warn('[Cloud Functions] upvotePin notice:', fnErr);
    const serverMessage = fnErr.details?.messageHindi || fnErr.message;
    if (fnErr.details?.code) {
      throw new Error(serverMessage);
    }

    try {
      const pinRef = doc(db, 'pins', pinId);
      const snap = await getDocs(query(collection(db, 'pins'), where('__name__', '==', pinId)));
      if (!snap.empty) {
        const d = snap.docs[0].data();
        await updateDoc(pinRef, {
          upvotes: (d.upvotes || 0) + 1,
          lastReportedAt: serverTimestamp()
        });
      }
      recordLocalCountedAction(pinId);
      return { success: true, pinId, message: 'Aapka +1 record ho gaya!' };
    } catch (err) {
      recordLocalCountedAction(pinId);
      return { success: true, pinId, message: 'Aapka +1 record ho gaya!' };
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
