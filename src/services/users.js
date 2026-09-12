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

export function publicProfilePayload(data) {
  return {
    displayName: data.displayName,
    role: data.role === 'admin' ? 'admin' : 'player',
    stats: data.stats || emptyLifetime(),
    games: data.games || gameStatsMap(),
  };
}

async function writePublicProfile(uid, data) {
  try {
    await setDoc(doc(db, 'publicProfiles', uid), publicProfilePayload(data), { merge: true });
  } catch {
    // Rules may not be deployed yet; ranked play still works off the public profile once live.
  }
}

async function readPublicStats(uid, fallback) {
  try {
    const pub = await getDoc(doc(db, 'publicProfiles', uid));
    if (!pub.exists()) return fallback;
    const data = pub.data();
    return {
      ...fallback,
      stats: data.stats || fallback.stats,
      games: data.games || fallback.games,
      displayName: data.displayName || fallback.displayName,
    };
  } catch {
    return fallback;
  }
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
    await writePublicProfile(firebaseUser.uid, profile);
    return { id: firebaseUser.uid, ...profile };
  }

  const data = snap.data();
  const patch = {};
  if (shouldAdmin && data.role !== 'admin') patch.role = 'admin';
  if (email && data.email !== email) patch.email = email;
  if (Object.keys(patch).length) {
    try {
      await updateDoc(ref, patch);
    } catch {
      /* role/email may already be set; ignore rule rejects */
    }
  }
  const merged = await readPublicStats(firebaseUser.uid, {
    id: firebaseUser.uid,
    ...data,
    ...patch,
  });
  return merged;
}

export async function updateDisplayName(uid, displayName) {
  const trimmed = displayName.trim();
  await updateDoc(doc(db, 'users', uid), { displayName: trimmed });
  try {
    await setDoc(doc(db, 'publicProfiles', uid), { displayName: trimmed }, { merge: true });
  } catch {
    /* ignore */
  }
}

export async function getUser(uid) {
  try {
    const pub = await getDoc(doc(db, 'publicProfiles', uid));
    if (pub.exists()) return { id: uid, ...pub.data() };
  } catch {
    /* fall through */
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { id: uid, ...data, email: undefined };
  } catch {
    return null;
  }
}

export async function listPublicProfiles(max = 80) {
  try {
    const snap = await getDocs(query(collection(db, 'publicProfiles'), limit(max)));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch {
    return [];
  }
}

export async function listUsers(max = 80) {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('displayName'), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function adminUpdateUser(uid, patch) {
  await updateDoc(doc(db, 'users', uid), patch);
  const publicPatch = {};
  if (patch.displayName !== undefined) publicPatch.displayName = patch.displayName;
  if (patch.role !== undefined) publicPatch.role = patch.role === 'admin' ? 'admin' : 'player';
  if (Object.keys(publicPatch).length) {
    try {
      await setDoc(doc(db, 'publicProfiles', uid), publicPatch, { merge: true });
    } catch {
      /* ignore */
    }
  }
}
