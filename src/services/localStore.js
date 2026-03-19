const STORAGE_KEYS = {
  users: 'clario_users',
  sessions: 'clario_sessions',
  ratings: 'clario_ratings',
  currentUser: 'clario_current_user',
};

function getCollection(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCollection(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getUsers() {
  return getCollection(STORAGE_KEYS.users);
}

export function setUsers(users) {
  setCollection(STORAGE_KEYS.users, users);
}

export function getSessions() {
  return getCollection(STORAGE_KEYS.sessions);
}

export function setSessions(sessions) {
  setCollection(STORAGE_KEYS.sessions, sessions);
}

export function getRatings() {
  return getCollection(STORAGE_KEYS.ratings);
}

export function setRatings(ratings) {
  setCollection(STORAGE_KEYS.ratings, ratings);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
