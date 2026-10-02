import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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
 * Permanent Delete pin
 */
export async function hardDeletePin(pinId) {
  if (!pinId) return false;
  const pinRef = doc(db, 'pins', pinId);
  await deleteDoc(pinRef);
  return true;
}

