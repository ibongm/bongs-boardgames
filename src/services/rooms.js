import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { randomRoomCode } from '../lib/codes.js';
import { hashRoomPassword } from '../lib/hash.js';
import { getGame } from '../games/registry.js';

const roomsCol = () => collection(db, 'rooms');

export function emptySeat() {
  return { uid: null, name: null, type: 'empty', difficulty: null, lastSeen: null, disconnectedAt: null };
}

export async function createRoom({ host, gameId, password }) {
  const game = getGame(gameId);
  if (!game) throw new Error('Unknown game');
  const code = randomRoomCode();
  const passwordHash = password ? await hashRoomPassword(code, password) : null;
  const seats = Array.from({ length: game.meta.seats }, emptySeat);
  seats[0] = {
    uid: host.uid,
    name: host.displayName,
    type: 'human',
    difficulty: null,
    lastSeen: Date.now(),
    disconnectedAt: null,
  };
  const payload = {
    code,
    gameId,
    hostId: host.uid,
    passwordHash,
    status: 'waiting',
    seats,
    spectators: [],
    matchId: null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(roomsCol(), payload);
  return { id: ref.id, ...payload };
}

export async function findRoomByCode(code) {
  const snap = await getDocs(query(roomsCol(), where('code', '==', code.toUpperCase()), limit(1)));
  if (snap.empty) return null;
  const item = snap.docs[0];
  return { id: item.id, ...item.data() };
}

export function watchLobby(callback) {
  return onSnapshot(query(roomsCol(), where('status', 'in', ['waiting', 'playing']), limit(40)), (snap) => {
    const rooms = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    rooms.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(rooms);
  });
}

export function watchRoom(roomId, callback) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function getRoom(roomId) {
  const snap = await getDoc(doc(db, 'rooms', roomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateRoom(roomId, patch) {
  await updateDoc(doc(db, 'rooms', roomId), patch);
}

export async function closeRoom(roomId) {
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function verifyPassword(room, password) {
  if (!room.passwordHash) return true;
  return (await hashRoomPassword(room.code, password || '')) === room.passwordHash;
}
