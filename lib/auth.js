// Verifies Firebase ID tokens sent by the browser. Tokens are checked against Google's public
// keys, so this only needs the project ID.
import { getAuth } from 'firebase-admin/auth';
import { firebaseApp } from './firebase.js';

// Express middleware: requires "Authorization: Bearer <ID token>" and sets req.uid.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Please sign in.' });

  let firebaseAuth;
  try {
    firebaseAuth = getAuth(firebaseApp());
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
