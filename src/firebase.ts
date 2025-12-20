// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Note: API keys for Firebase web apps are safe to be public as they're just identifiers
// Security is enforced through Firebase Security Rules
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBOSfhZ6q-jYkugtPSACBebCvP1_qMZh3g",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "smart-timetable-schedular.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "smart-timetable-schedular",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "smart-timetable-schedular.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "152633812364",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:152633812364:web:f72836562dcbdb956aa2a9",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-4J3PTRKH8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;