import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Production Firebase configuration for project '11Players'
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDkbA5VyNYGIOunvm6RWqP1i4Si8nZlXzw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "an-11-players.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "an-11-players",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "an-11-players.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "53094281837",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:53094281837:web:cdc94455814170f2ee8564",
};

// Initialize Firebase App
let app;
let dbInstance;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Force long polling to bypass WebSocket blockages in strict networks (e.g., Egypt)
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true });
} else {
  app = getApp();
  dbInstance = getFirestore(app);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = dbInstance;
export const storage = getStorage(app);

export const CLOUDINARY_CONFIG = {
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "11players",
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfvh4jcsh",
};

export default app;
