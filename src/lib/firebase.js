import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDGOFJQZZHt901NBCNTty0Zv1B_ylwW5gs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bongs-boardgames-55d28.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bongs-boardgames-55d28',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bongs-boardgames-55d28.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '621917680907',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:621917680907:web:785975c2f2f64a549e9e0e',
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'ivanm.ploce@gmail.com').trim().toLowerCase();
