// Shared Firebase Admin setup (used for verifying sign-in tokens and for Firestore).
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';

// Verifying sign-in tokens only needs the project ID. Reading/writing Firestore also needs a
// service-account key, given either as a file path in GOOGLE_APPLICATION_CREDENTIALS or as the
// JSON itself in FIREBASE_SERVICE_ACCOUNT.
export function hasServiceAccount() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE, // running on Google Cloud (Cloud Functions/Run): credentials are automatic
  );
}

export function firebaseApp() {
  const [existing] = getApps();
  if (existing) return existing;

  // On Cloud Functions the project ID is provided as GCLOUD_PROJECT (FIREBASE_* names are reserved there).
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set. Add it to .env and restart the server.');
  }

  // Only pass `credential` when we have one: Firebase rejects an explicit undefined.
  const options = { projectId };
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    options.credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = applicationDefault();
  }
  return initializeApp(options);
}
