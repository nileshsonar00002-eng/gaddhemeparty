import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  limit,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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

// Ensure anonymous session for Firestore rules access
export function initAdminAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (e) {
          console.warn('[Admin Auth] Anonymous session warning:', e);
          resolve({ uid: 'admin_local' });
        }
      }
    });
  });
}

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
    moderatedBy: 'admin'
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
    moderatedBy: 'admin'
  });
  return true;
}

/**
 * Bulk Approve multiple pins
 */
export async function bulkApprovePins(pinIds) {
  if (!Array.isArray(pinIds) || pinIds.length === 0) return 0;
  const batch = writeBatch(db);
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.update(pinRef, {
      photoStatus: 'approved',
      photoApproved: true,
      photoApprovedAt: serverTimestamp(),
      moderatedBy: 'admin'
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
  pinIds.forEach((id) => {
    const pinRef = doc(db, 'pins', id);
    batch.update(pinRef, {
      photoStatus: 'rejected',
      photoApproved: false,
      photoRejectedReason: reason,
      photoRejectedAt: serverTimestamp(),
      moderatedBy: 'admin'
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
      moderatedBy: 'admin'
    };

    if (imageIndex === 0 || !data.imageUrl || data.imageUrl === (data.images && data.images[0])) {
      updates.imageUrl = currentImages[0] || newImageUrl;
      updates.thumbnailUrl = currentThumbs[0] || newImageUrl;
    }

    await updateDoc(pinRef, updates);
    return true;
  } catch (err) {
    console.error('[Admin Firebase] Error updating pin image:', err);
    // Fallback direct update
    await updateDoc(pinRef, {
      imageUrl: newImageUrl,
      thumbnailUrl: newImageUrl,
      images: [newImageUrl],
      thumbnails: [newImageUrl],
      photoApproved: true,
      photoStatus: 'approved',
      photoApprovedAt: serverTimestamp(),
      moderatedBy: 'admin'
    });
    return true;
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


