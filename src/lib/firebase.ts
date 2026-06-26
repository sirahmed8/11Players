import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration for project '11Players'
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "11players.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "11players",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "11players.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

// Initialize Firebase App
let app;
let dbInstance;

if (getApps().length > 0) {
  app = getApp();
  dbInstance = getFirestore(app);
} else {
  app = initializeApp(firebaseConfig);
  // Optimize Firestore connections for Next.js to prevent "client is offline" and slow loading
  dbInstance = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = dbInstance;
export const storage = getStorage(app);

/* 
  Cloudinary Integration Details:
  - Project Name: '11Players'
  - Local Repository Name: '11Players'
  - Client-Side Unsigned Upload Configuration:
    * Preset Name: Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable
    * Cloud Name: Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable
    * Upload Endpoint: https://api.cloudinary.com/v1_1/${cloudName}/image/upload
*/
export const CLOUDINARY_CONFIG = {
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "11players",
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfvh4jcsh",
};

export default app;
