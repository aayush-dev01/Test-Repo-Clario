import {
  collection, addDoc, onSnapshot, query,
  orderBy, updateDoc, doc, where, writeBatch, getDocs, limit,
} from 'firebase/firestore';
import { db, serverTimestamp } from './firebase';

export async function createNotification(userId, { type, title, body, link = '' }) {
  if (!userId) return;
  await addDoc(collection(db, 'notifications', userId, 'items'), {
    type, title, body, link,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(userId, callback) {
  if (!userId) return () => {};
  // orderBy requires a Firestore index — query without it first, sort client-side
  // This avoids breaking the UI while the index builds
  const q = query(
    collection(db, 'notifications', userId, 'items'),
    limit(50),
  );
  return onSnapshot(q,
    snap => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // Handle both Firestore Timestamps and null (pending server write)
          const at = a.createdAt?.seconds ?? 0;
          const bt = b.createdAt?.seconds ?? 0;
          return bt - at; // newest first
        });
      callback(items);
    },
    err => {
      console.warn('Notification subscription error:', err.code, err.message);
      callback([]); // fail gracefully
    }
  );
}

export async function markNotificationRead(userId, notifId) {
  if (!userId || !notifId) return;
  try {
    await updateDoc(doc(db, 'notifications', userId, 'items', notifId), { read: true });
  } catch (e) { console.warn('markRead:', e); }
}

export async function markAllRead(userId) {
  if (!userId) return;
  try {
    const snap = await getDocs(
      query(collection(db, 'notifications', userId, 'items'), where('read', '==', false))
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (e) { console.warn('markAllRead:', e); }
}
