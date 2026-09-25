// Firestore storage. Layout:
//   users/{uid}                 { goal, activated, activatedAt }
//   users/{uid}/entries/{id}    { date, time, description, protein_g, createdAt }
// Only this server touches Firestore (through the Admin SDK), so client access can stay locked.
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseApp, hasServiceAccount } from './firebase.js';

const DEFAULT_GOAL = 100;

function userDoc(uid) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid user id');
  if (!hasServiceAccount()) {
    throw new Error(
      'Firestore credentials are missing. Set GOOGLE_APPLICATION_CREDENTIALS (path to a service-account key file) or FIREBASE_SERVICE_ACCOUNT.',
    );
  }
  return getFirestore(firebaseApp()).collection('users').doc(uid);
}

// Local calendar date as YYYY-MM-DD (fallback; the browser normally sends its own date).
export function todayString() {
  return new Date().toLocaleDateString('en-CA');
}

// Entries for one calendar day, oldest first.
export async function readEntries(uid, date) {
  const snap = await userDoc(uid).collection('entries').where('date', '==', date).get();
  return snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(({ date, time, description, protein_g }) => ({ date, time, description, protein_g }));
}

export async function addEntry(uid, { description, protein_g, date, time }) {
  const entry = { date, time, description: description.replaceAll('\n', ' '), protein_g };
  await userDoc(uid).collection('entries').add({ ...entry, createdAt: Date.now() });
  return entry;
}

export async function readGoal(uid) {
  const snap = await userDoc(uid).get();
  return snap.data()?.goal ?? DEFAULT_GOAL;
}

export async function writeGoal(uid, goal) {
  await userDoc(uid).set({ goal }, { merge: true });
  return goal;
}

// A user is "activated" once they've redeemed an invite code (see lib/invites.js).
export async function isActivated(uid) {
  const snap = await userDoc(uid).get();
  return snap.data()?.activated === true;
}

export async function markActivated(uid) {
  await userDoc(uid).set({ activated: true, activatedAt: new Date().toISOString() }, { merge: true });
}
