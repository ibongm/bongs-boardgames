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
import { auth, firebaseReady } from '../lib/firebase.js';
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
      const doc = await ensureUserDocument(user);
      setProfile(doc);
      setLoading(false);
    });
  }, []);

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
  return useContext(AuthContext);
}
