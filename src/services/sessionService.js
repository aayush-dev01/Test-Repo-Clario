import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, serverTimestamp } from './firebase';
import { createNotification } from './notificationService';

const sessionsCollection = collection(db, 'sessions');

function sanitizeSession(snapshot) {
  if (!snapshot?.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function createSessionRequest(studentId, tutorId, skill, message = '') {
  const sessionRef = doc(sessionsCollection);
  const safeRoomId = `ClarioSession${sessionRef.id}`.replace(/[^a-zA-Z0-9-_]/g, '');
  const payload = {
    id: sessionRef.id,
    studentId,
    tutorId,
    participantIds: [studentId, tutorId],
    skill,
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    jitsiRoomId: safeRoomId,
  };
  await setDoc(sessionRef, payload);

  // Notify tutor of new request
  try {
    await createNotification(tutorId, {
      type:  'session_request',
      title: 'New session request 📬',
      body:  `A student wants to learn ${skill}`,
      link:  '/tutor/requests',
    });
  } catch (e) { console.warn('Notification failed:', e); }

  return { id: sessionRef.id, ...payload };
}

export async function acceptSession(sessionId, scheduledAt, jitsiRoomId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'accepted',
    scheduledAt: scheduledAt || new Date().toISOString(),
    jitsiRoomId: (jitsiRoomId || `ClarioSession${sessionId}`).replace(/[^a-zA-Z0-9-_]/g, ''),
    updatedAt: serverTimestamp(),
  });
}

export async function rejectSession(sessionId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function startSession(sessionId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'in_progress',
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function completeSession(sessionId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function listSessionsByField(field, value) {
  const snapshot = await getDocs(query(sessionsCollection, where(field, '==', value)));
  return sortNewest(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
}

export async function getSessionsForStudent(studentId) {
  return listSessionsByField('studentId', studentId);
}

export async function getSessionsForTutor(tutorId) {
  return listSessionsByField('tutorId', tutorId);
}

export async function getSessionById(sessionId) {
  const snapshot = await getDoc(doc(db, 'sessions', sessionId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function getPendingRequestsForTutor(tutorId) {
  const sessions = await listSessionsByField('tutorId', tutorId);
  return sessions.filter((session) => session.status === 'pending');
}

export function subscribeSessionById(sessionId, callback) {
  return onSnapshot(doc(db, 'sessions', sessionId), (snapshot) => {
    callback(sanitizeSession(snapshot));
  });
}

function subscribeSessionsByField(field, value, callback, filterFn = null) {
  return onSnapshot(query(sessionsCollection, where(field, '==', value)), (snapshot) => {
    const sessions = sortNewest(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    callback(filterFn ? sessions.filter(filterFn) : sessions);
  });
}

export function subscribeSessionsForStudent(studentId, callback) {
  return subscribeSessionsByField('studentId', studentId, callback);
}

export function subscribeSessionsForTutor(tutorId, callback) {
  return subscribeSessionsByField('tutorId', tutorId, callback);
}

export function subscribePendingRequestsForTutor(tutorId, callback) {
  return subscribeSessionsByField('tutorId', tutorId, callback, (session) => session.status === 'pending');
}
