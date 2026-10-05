import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// These values are public identifiers (not secrets). They come from .env as VITE_FIREBASE_*.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);

// null until the Firebase settings are added to .env, so the app can show a setup message.
export const auth = firebaseConfigured ? getAuth(initializeApp(config)) : null;
