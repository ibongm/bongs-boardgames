import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { adminEmail, db } from '../lib/firebase.js';
import { emptyGameStats, emptyLifetime } from '../lib/codes.js';
import { listGames } from '../games/registry.js';

function gameStatsMap() {
  const games = {};
  for (const game of listGames()) games[game.meta.id] = emptyGameStats();
  return games;
}

export async function ensureUserDocument(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  const email = (firebaseUser.email || '').toLowerCase();
  const shouldAdmin = adminEmail && email === adminEmail;

  if (!snap.exists()) {
    const profile = {
      displayName: firebaseUser.displayName || email.split('@')[0] || 'Player',
      email,
      role: shouldAdmin ? 'admin' : 'player',
      disabled: false,
      createdAt: serverTimestamp(),
      stats: emptyLifetime(),
      games: gameStatsMap(),
    };
    await setDoc(ref, profile);
    return { id: firebaseUser.uid, ...profile };
  }

  const data = snap.data();
  const patch = {};
  if (shouldAdmin && data.role !== 'admin') patch.role = 'admin';
  if (!data.games) patch.games = gameStatsMap();
  if (!data.stats) patch.stats = emptyLifetime();
  if (Object.keys(patch).length) await updateDoc(ref, patch);
  return { id: firebaseUser.uid, ...data, ...patch };
}

export async function updateDisplayName(uid, displayName) {
  await updateDoc(doc(db, 'users', uid), { displayName: displayName.trim() });
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: uid, ...snap.data() } : null;
}

export async function listUsers(max = 80) {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('displayName'), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function adminUpdateUser(uid, patch) {
  await updateDoc(doc(db, 'users', uid), patch);
}
