// Verifies Firebase ID tokens sent by the browser. Only the project ID is needed:
// tokens are checked against Google's public keys, so there is no server secret to manage.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function auth() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is not set. Add it to .env and restart the server.');
  }
  if (getApps().length === 0) initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  return getAuth();
}

// Express middleware: requires "Authorization: Bearer <ID token>" and sets req.uid.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Please sign in.' });

  let firebaseAuth;
  try {
    firebaseAuth = auth();
  } catch (err) {
    return next(err); // misconfiguration -> 500 with a clear message
  }

  try {
    req.uid = (await firebaseAuth.verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}
