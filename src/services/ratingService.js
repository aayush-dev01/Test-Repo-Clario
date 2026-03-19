import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db, serverTimestamp } from './firebase';

export async function addRating(sessionId, raterId, tutorId, rating, review = '') {
  const ratingRef = doc(db, 'ratings', `${sessionId}_${raterId}`);
  await setDoc(ratingRef, {
    sessionId,
    raterId,
    tutorId,
    rating,
    review,
    createdAt: serverTimestamp(),
  });
}

export async function getRatingsForTutor(tutorId) {
  const snapshot = await getDocs(query(collection(db, 'ratings'), where('tutorId', '==', tutorId)));
  const ratings = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
  if (ratings.length === 0) return { average: 0, count: 0, ratings: [] };
  const sum = ratings.reduce((total, entry) => total + entry.rating, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
    ratings,
  };
}
