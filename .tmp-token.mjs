import { getAuth } from 'firebase-admin/auth';
import { firebaseApp } from './backend/lib/firebase.js';
const uid = 'deploy-test-user';
const custom = await getAuth(firebaseApp()).createCustomToken(uid);
const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.VITE_FIREBASE_API_KEY}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: custom, returnSecureToken: true }),
});
const j = await r.json();
if (!j.idToken) { console.error('no id token:', JSON.stringify(j).slice(0,200)); process.exit(1); }
process.stdout.write(j.idToken);
