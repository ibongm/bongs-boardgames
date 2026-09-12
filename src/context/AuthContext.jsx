import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseReady } from '../lib/firebase.js';
import { ensureUserDocument } from '../services/users.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const initialDoc = await ensureUserDocument(user);
      setProfile(initialDoc);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady || !firebaseUser?.uid) return undefined;
    return onSnapshot(doc(db, 'publicProfiles', firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        const live = snap.data();
        setProfile((prev) => (prev ? { ...prev, ...live } : live));
      }
    });
  }, [firebaseUser?.uid]);

  const value = useMemo(
    () => ({
      firebaseReady,
      firebaseUser,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      disabled: Boolean(profile?.disabled),
      async register(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(cred.user, { displayName });
      },
      login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
      },
      loginGoogle() {
        return signInWithPopup(auth, new GoogleAuthProvider());
      },
      logout() {
        return signOut(auth);
      },
      setProfile,
    }),
    [firebaseUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext) || {};
}
