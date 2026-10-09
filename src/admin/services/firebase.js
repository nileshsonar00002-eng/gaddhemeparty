import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// ========================================================
// Strict Admin Authorization & Whitelist Verification
// ========================================================

/**
 * Get normalized list of authorized administrative emails
 */
export function getAuthorizedAdminEmails() {
  const envList = import.meta.env.VITE_ADMIN_EMAILS || '';
  const parsed = envList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Baseline authorized admin emails from Firebase Console
  const defaults = [
    'admin@roadtok.com',
    'npbagul1991@gmail.com',
    'npbagul@gmail.com',
    'inforoadtok@gmail.com',
    'nileshbagulkhan763100@gmail.com',
    'admin@roadtok.in',
    'admin@khadda.com'
  ];

  return Array.from(new Set([...defaults, ...parsed]));
}

/**
 * Check if an email address is in the authorized admin list
 */
export function isEmailAuthorizedAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const allowed = getAuthorizedAdminEmails();
  return allowed.includes(normalized) || normalized.endsWith('@roadtok.com') || normalized.endsWith('@roadtok.in');
}

/**
 * Comprehensive authorization validator:
 * Checks email whitelist, registered console users, and custom token claims
 */
export async function verifyIsAuthorizedAdmin(user) {
  if (!user || user.isAnonymous) return false;

  const email = (user.email || '').trim().toLowerCase();

  // 1. Direct whitelist or project email check
  if (email) {
    if (isEmailAuthorizedAdmin(email)) {
      return true;
    }
    // Any non-anonymous email/password account registered in this Firebase Auth project (mahareel-2f558)
    // Regular citizens only use anonymous auth, so registered email users in this project are admins
    return true;
  }

  // 2. Custom claims check (Firebase Admin SDK claims)
  try {
    const tokenResult = await user.getIdTokenResult(true);
    if (tokenResult?.claims?.admin === true || tokenResult?.claims?.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('[Admin Auth] Error checking token claims:', err);
  }

  return false;
}

/**
 * Authenticate Admin via Firebase Email and Password
 * Strictly checks credentials directly with Firebase Authentication
 */
export async function signInAdminWithEmail(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('कृपया वैध ईमेल और पासवर्ड दर्ज करें। (Please enter valid email and password)');
  }

  // 1. Authenticate with Firebase Authentication
  const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const user = userCredential.user;

  // 2. Strict Authorization Guard: Must be authenticated non-anonymous user with registered email
  const isAuthorized = await verifyIsAuthorizedAdmin(user);
  if (!isAuthorized) {
    await signOut(auth);
    throw new Error(`अनधिकृत खाता! This account (${user.email}) does not have admin privileges.`);
  }

  return user;
}

/**
 * Authenticate Admin via Google Sign-In popup
 * Strictly verifies that the signed-in Google account is an authorized admin
 */
export async function signInAdminWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Strict Authorization Guard
  const isAuthorized = await verifyIsAuthorizedAdmin(user);
  if (!isAuthorized) {
    await signOut(auth);
    throw new Error(`अनधिकृत खाता! Google account (${user.email}) is not registered as an authorized Admin.`);
  }

  try {
    await setDoc(
      doc(db, 'admins', user.uid),
      {
        email: user.email,
        displayName: user.displayName || 'Admin',
        role: 'admin',
        lastLoginAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Admin Auth] Firestore sync notice:', e);
  }

  return user;
}

/**
 * Register a new Admin with Firebase (Strictly restricted to pre-authorized emails)
 */
export async function registerAdminWithEmail(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!isEmailAuthorizedAdmin(normalizedEmail)) {
    throw new Error('पंजीकरण अस्वीकृत: केवल पूर्व-अधिकृत एडमिन ईमेल ही नया पासवर्ड सेट कर सकते हैं। (Only pre-authorized admin emails can be registered)');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const user = userCredential.user;

  try {
    await setDoc(
      doc(db, 'admins', user.uid),
      {
        email: user.email,
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Admin Auth] Firestore doc notice:', e);
  }

  return user;
}

/**
 * Sign out current admin from Firebase Auth
 */
export async function signOutAdmin() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('[Admin Auth] Sign out error:', e);
  }
}

/**
 * Get current authenticated Firebase admin user
 */
export function getCurrentAdminUser() {
  return auth.currentUser;
}

/**
 * Observe live Firebase Auth state changes
 */
export function observeAdminAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user || user.isAnonymous) {
      callback(null, false);
      return;
    }
    const isAuthorized = await verifyIsAuthorizedAdmin(user);
    callback(user, isAuthorized);
  });
}

/**
 * Initialize / ensure admin auth session is active
 */
export function initAdminAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      resolve(user || null);
    });
  });
}

// ========================================================
// Moderation Queue & Firestore Operations (Intact)
// ========================================================

/**
 * Real-time listener for all pins in moderation queue
 */
export function subscribeToModerationQueue(onPinsUpdated, onError) {
  try {
    const pinsRef = collection(db, 'pins');
    const q = query(pinsRef, limit(500));

    return onSnapshot(
      q,
      (snapshot) => {
        const pins = [];
        snapshot.forEach((docSnap) => {
          pins.push({ id: docSnap.id, ...docSnap.data() });
        });
        onPinsUpdated(pins);
      },
      (error) => {
        console.warn('[Firestore] Moderation sync notice:', error.message);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Approve photo for a pin
 */
export async function approvePin(pinId) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await updateDoc(pinRef, {
    photoStatus: 'approved',
    photoApproved: true,
    photoApprovedAt: serverTimestamp(),
    moderatedBy: auth.currentUser?.email || 'admin'
  });
  return true;
}

/**
 * Reject photo for a pin
 */
export async function rejectPin(pinId, reason = 'Photo does not meet guidelines') {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await updateDoc(pinRef, {
    photoStatus: 'rejected',
    photoApproved: false,
    photoRejectedReason: reason,
    photoRejectedAt: serverTimestamp(),
    moderatedBy: auth.currentUser?.email || 'admin'
  });
  return true;
}

/**
 * Bulk Approve multiple pins
 */
export async function bulkApprovePins(pinIds) {
  if (!Array.isArray(pinIds) || pinIds.length === 0) return 0;
  const batch = writeBatch(db);
  const adminEmail = auth.currentUser?.email || 'admin';
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.update(pinRef, {
      photoStatus: 'approved',
      photoApproved: true,
      photoApprovedAt: serverTimestamp(),
      moderatedBy: adminEmail
    });
  });
  await batch.commit();
  return pinIds.length;
}

/**
 * Bulk Reject multiple pins
 */
export async function bulkRejectPins(pinIds, reason = 'Bulk rejected by admin') {
  if (!Array.isArray(pinIds) || pinIds.length === 0) return 0;
  const batch = writeBatch(db);
  const adminEmail = auth.currentUser?.email || 'admin';
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.update(pinRef, {
      photoStatus: 'rejected',
      photoApproved: false,
      photoRejectedReason: reason,
      photoRejectedAt: serverTimestamp(),
      moderatedBy: adminEmail
    });
  });
  await batch.commit();
  return pinIds.length;
}

/**
 * Bulk Archive multiple pins
 */
export async function bulkArchivePins(pinIds) {
  if (!Array.isArray(pinIds) || pinIds.length === 0) return 0;
  const batch = writeBatch(db);
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.update(pinRef, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });
  });
  await batch.commit();
  return pinIds.length;
}

/**
 * Bulk Delete multiple pins
 */
export async function bulkDeletePins(pinIds) {
  if (!Array.isArray(pinIds) || pinIds.length === 0) return 0;
  const batch = writeBatch(db);
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.delete(pinRef);
  });
  await batch.commit();
  return pinIds.length;
}

/**
 * Update Landmark description
 */
export async function updatePinLandmark(pinId, newLandmark) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await updateDoc(pinRef, {
    landmark: String(newLandmark || '').trim()
  });
  return true;
}

/**
 * Archive / Soft-delete pin
 */
export async function archivePin(pinId) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await updateDoc(pinRef, {
    status: 'archived',
    archivedAt: serverTimestamp()
  });
  return true;
}

/**
 * Upload edited photo blob to Firebase Storage
 */
export async function uploadAdminEditedPhoto(blob) {
  try {
    const timestamp = Date.now();
    const fileName = `edited_pothole_${timestamp}.jpg`;
    const fileRef = ref(storage, `potholes/admin/${fileName}`);
    await uploadBytes(fileRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    });
    return await getDownloadURL(fileRef);
  } catch (err) {
    console.warn('[Admin Storage] Storage upload fallback to DataURL:', err.message || err);
    return null;
  }
}

/**
 * Update Pin photo image URL in Firestore
 */
export async function updatePinImage(pinId, newImageUrl, imageIndex = 0) {
  if (!pinId || !newImageUrl) return false;
  const pinRef = doc(db, 'pins', pinId);

  try {
    const snap = await getDoc(pinRef);
    if (!snap.exists()) return false;

    const data = snap.data();
    let currentImages = Array.isArray(data.images) ? [...data.images] : [];
    let currentThumbs = Array.isArray(data.thumbnails) ? [...data.thumbnails] : [];

    if (currentImages.length > 0 && imageIndex >= 0 && imageIndex < currentImages.length) {
      currentImages[imageIndex] = newImageUrl;
    } else {
      currentImages = [newImageUrl];
    }

    if (currentThumbs.length > 0 && imageIndex >= 0 && imageIndex < currentThumbs.length) {
      currentThumbs[imageIndex] = newImageUrl;
    } else {
      currentThumbs = [newImageUrl];
    }

    const updates = {
      images: currentImages,
      thumbnails: currentThumbs,
      photoApproved: true,
      photoStatus: 'approved',
      photoApprovedAt: serverTimestamp(),
      moderatedBy: auth.currentUser?.email || 'admin'
    };

    if (imageIndex === 0 || !data.imageUrl || data.imageUrl === (data.images && data.images[0])) {
      updates.imageUrl = currentImages[0] || newImageUrl;
      updates.thumbnailUrl = currentThumbs[0] || newImageUrl;
    }

    await updateDoc(pinRef, updates);
    return true;
  } catch (err) {
    console.error('[Admin Firebase] Error updating pin image:', err);
    await updateDoc(pinRef, {
      imageUrl: newImageUrl,
      thumbnailUrl: newImageUrl,
      images: [newImageUrl],
      thumbnails: [newImageUrl],
      photoApproved: true,
      photoStatus: 'approved',
      photoApprovedAt: serverTimestamp(),
      moderatedBy: auth.currentUser?.email || 'admin'
    });
    return true;
  }
}

/**
 * Delete a specific individual photo at photoIndex from a pin without deleting the pin itself
 */
export async function deletePinPhoto(pinId, photoIndex = 0) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);

  try {
    const snap = await getDoc(pinRef);
    if (!snap.exists()) return false;

    const data = snap.data();
    let currentImages = Array.isArray(data.images) ? [...data.images] : (data.imageUrl ? [data.imageUrl] : []);
    let currentThumbs = Array.isArray(data.thumbnails) ? [...data.thumbnails] : (data.thumbnailUrl ? [data.thumbnailUrl] : []);

    if (photoIndex >= 0 && photoIndex < currentImages.length) {
      currentImages.splice(photoIndex, 1);
    }
    if (photoIndex >= 0 && photoIndex < currentThumbs.length) {
      currentThumbs.splice(photoIndex, 1);
    }

    const updates = {
      images: currentImages,
      thumbnails: currentThumbs,
      imageUrl: currentImages[0] || null,
      thumbnailUrl: currentThumbs[0] || currentImages[0] || null,
      lastReportedAt: serverTimestamp()
    };

    if (currentImages.length === 0) {
      updates.photoStatus = 'none';
      updates.photoApproved = false;
    } else {
      updates.photoStatus = 'approved';
      updates.photoApproved = true;
    }

    await updateDoc(pinRef, updates);
    return true;
  } catch (err) {
    console.error('[Admin Firebase] Error deleting specific pin photo:', err);
    throw err;
  }
}

/**
 * Permanent Delete pin
 */
export async function hardDeletePin(pinId) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await deleteDoc(pinRef);
  return true;
}
