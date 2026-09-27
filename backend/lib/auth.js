// Verifies Firebase ID tokens sent by the browser. Tokens are checked against Google's public
// keys, so this only needs the project ID.
import { getAuth } from 'firebase-admin/auth';
import { firebaseApp } from './firebase.js';

// The browser sends the ID token in "X-Firebase-Auth" rather than "Authorization". Right after
// the first production deploy, Google's Cloud Functions front door rejected Firebase tokens sent
// as "Authorization: Bearer" before this code ran, so a custom header is the safe choice.
// "Authorization: Bearer" is still accepted as a fallback (handy for curl and local testing).
const tokenFrom = (req) =>
  req.headers['x-firebase-auth'] || req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

// Express middleware: requires a Firebase ID token and sets req.uid.
export async function requireAuth(req, res, next) {
  const token = tokenFrom(req);
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
