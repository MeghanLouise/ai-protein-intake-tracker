import { getAuth } from 'firebase-admin/auth';
import { firebaseApp } from './backend/lib/firebase.js';
import { markActivated, addWorkout, addSupplement, setSupplementCheck } from './backend/lib/storage.js';

const uid = 'daysummary-test-user';
const date = new Date().toLocaleDateString('en-CA');
await markActivated(uid);
await addWorkout(uid, { category: 'Push day', exercise: 'Bench Press', weight: 60, reps: 8, date, time: '09:00' });
await addWorkout(uid, { category: 'Push day', exercise: 'Overhead Press', weight: 30, reps: 10, date, time: '09:10' });
await addSupplement(uid, 'Vitamin D');
await addSupplement(uid, 'Creatine');
await setSupplementCheck(uid, date, 'Vitamin D', true);

const custom = await getAuth(firebaseApp()).createCustomToken(uid);
const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.VITE_FIREBASE_API_KEY}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: custom, returnSecureToken: true }),
});
const j = await r.json();
if (!j.idToken) { console.error('exchange failed:', JSON.stringify(j).slice(0,200)); process.exit(1); }
console.log('date_used:' + date);
console.log('custom_token:' + custom);
