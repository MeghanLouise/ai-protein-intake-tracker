// Firestore storage. Layout:
//   users/{uid}                        { goal, activated, activatedAt, supplements, exerciseCatalog }
//   users/{uid}/entries/{id}           { date, time, description, protein_g, calories, fiber_g, createdAt }
//   users/{uid}/workouts/{id}          { date, time, category, exercise, weight, reps, createdAt }
//   users/{uid}/supplementDays/{date}  { date, taken: string[] }
// Only this server touches Firestore (through the Admin SDK), so client access can stay locked.
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
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
    .map(({ date, time, description, protein_g, calories, fiber_g }) => ({
      date,
      time,
      description,
      protein_g,
      calories: calories || 0,
      fiber_g: fiber_g || 0,
    }));
}

export async function addEntry(uid, { description, protein_g, calories, fiber_g, date, time }) {
  const entry = {
    date,
    time,
    description: description.replaceAll('\n', ' '),
    protein_g,
    calories: calories || 0,
    fiber_g: fiber_g || 0,
  };
  await userDoc(uid).collection('entries').add({ ...entry, createdAt: Date.now() });
  return entry;
}

// Workout sets for one calendar day, oldest first.
export async function readWorkouts(uid, date) {
  const snap = await userDoc(uid).collection('workouts').where('date', '==', date).get();
  return snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(({ date, time, category, exercise, weight, reps }) => ({
      date,
      time,
      category,
      exercise,
      weight,
      reps,
    }));
}

export async function addWorkout(uid, { category, exercise, weight, reps, date, time }) {
  const set = { date, time, category, exercise: exercise.replaceAll('\n', ' '), weight, reps };
  await userDoc(uid).collection('workouts').add({ ...set, createdAt: Date.now() });
  return set;
}

// The user's chosen exercises per day type. null means they haven't customized it yet, so the
// caller (see backend/app.js) falls back to the fixed default catalog.
export async function readExerciseCatalog(uid) {
  const snap = await userDoc(uid).get();
  return snap.data()?.exerciseCatalog ?? null;
}

export async function writeExerciseCatalog(uid, catalog) {
  await userDoc(uid).set({ exerciseCatalog: catalog }, { merge: true });
  return catalog;
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

// The user's own list of supplements they want to track (their personal catalog, not a per-day log).
export async function readSupplements(uid) {
  const snap = await userDoc(uid).get();
  return snap.data()?.supplements ?? [];
}

export async function addSupplement(uid, name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Supplement name is required.');
  const list = await readSupplements(uid);
  if (list.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return list; // no duplicates
  const next = [...list, trimmed];
  await userDoc(uid).set({ supplements: next }, { merge: true });
  return next;
}

export async function removeSupplement(uid, name) {
  const next = (await readSupplements(uid)).filter((s) => s !== name);
  await userDoc(uid).set({ supplements: next }, { merge: true });
  return next;
}

// Which supplements (by name) were checked off on a given day.
export async function readSupplementChecks(uid, date) {
  const snap = await userDoc(uid).collection('supplementDays').doc(date).get();
  return snap.data()?.taken ?? [];
}

export async function setSupplementCheck(uid, date, name, taken) {
  await userDoc(uid)
    .collection('supplementDays')
    .doc(date)
    .set(
      { date, taken: taken ? FieldValue.arrayUnion(name) : FieldValue.arrayRemove(name) },
      { merge: true },
    );
}
