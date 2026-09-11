import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { defaultSite } from '../lib/defaults.js';

const siteRef = () => doc(db, 'site', 'content');

export function mergeSite(data) {
  return { ...defaultSite, ...data, games: { ...defaultSite.games, ...(data?.games || {}) } };
}

export async function loadSite() {
  const snap = await getDoc(siteRef());
  return snap.exists() ? mergeSite(snap.data()) : defaultSite;
}

export function watchSite(callback) {
  return onSnapshot(siteRef(), (snap) => {
    callback(snap.exists() ? mergeSite(snap.data()) : defaultSite);
  });
}

export async function saveSite(content) {
  await setDoc(siteRef(), content, { merge: true });
}
