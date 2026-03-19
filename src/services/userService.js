import { collection, doc, getDoc, getDocs, query, serverTimestamp as firestoreServerTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

function sanitizeProfile(id, data) {
  if (!data) return null;
  return { id, ...data };
}

function getSkillName(skill) {
  return typeof skill === 'string' ? skill : skill?.name || skill?.skill || '';
}

function skillMatches(skills, skillName) {
  return (skills || []).some((skill) => getSkillName(skill).toLowerCase() === skillName.toLowerCase());
}

export async function getUserById(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? sanitizeProfile(snapshot.id, snapshot.data()) : null;
}

export async function updateUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: firestoreServerTimestamp(),
  }, { merge: true });
  return { id: uid, ...data };
}

export async function getTutorsBySkill(skill) {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'tutor')));
  return snapshot.docs
    .map((docSnapshot) => sanitizeProfile(docSnapshot.id, docSnapshot.data()))
    .filter((user) => skillMatches(user.skills, skill));
}

export async function getAllTutors() {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'tutor')));
  return snapshot.docs.map((docSnapshot) => sanitizeProfile(docSnapshot.id, docSnapshot.data()));
}

export async function addTutorSkill(uid, skill) {
  const profile = await getUserById(uid);
  if (!profile) return;
  const skills = profile.skills || [];
  if (skills.some((entry) => getSkillName(entry).toLowerCase() === getSkillName(skill).toLowerCase())) return;
  await updateUser(uid, { skills: [...skills, skill] });
}

export async function removeTutorSkill(uid, skill) {
  const profile = await getUserById(uid);
  if (!profile) return;
  const nextSkills = (profile.skills || []).filter((entry) => getSkillName(entry) !== getSkillName(skill));
  await updateUser(uid, { skills: nextSkills });
}
