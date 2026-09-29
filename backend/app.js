import express from 'express';
import { estimateNutrition } from './lib/ai.js';
import { requireAuth } from './lib/auth.js';
import { isValidInviteCode, requireInvite } from './lib/invites.js';
import {
  addEntry,
  addSupplement,
  addWorkout,
  isActivated,
  markActivated,
  readEntries,
  readExerciseCatalog,
  readGoal,
  readSupplementChecks,
  readSupplements,
  readWorkouts,
  removeSupplement,
  setSupplementCheck,
  todayString,
  writeExerciseCatalog,
  writeGoal,
} from './lib/storage.js';
import { EXERCISES, isValidExercise, sanitizeCatalog } from './lib/workouts.js';

// The API. server.js runs it locally; index.js runs it as a Cloud Function behind Firebase Hosting.
export const app = express();

// Images arrive as base64 in JSON, so allow a generous body size.
app.use(express.json({ limit: '10mb' }));

// Wrap async handlers so thrown errors reach the error middleware.
const route = (fn) => (req, res, next) => fn(req, res).catch(next);

const INVALID_CODE = { error: "That invite code isn't valid." };

// Public: lets the sign-up form check a code before an account is created.
app.post('/api/invite/check', (req, res) => {
  if (!isValidInviteCode(req.body?.code)) return res.status(400).json(INVALID_CODE);
  res.json({ ok: true });
});

// Everything below needs a signed-in Firebase user; the verified uid is on req.uid.
app.use('/api', requireAuth);

// Has this user redeemed an invite code yet?
app.get('/api/me', route(async (req, res) => {
  res.json({ activated: await isActivated(req.uid) });
}));

// Redeem an invite code to activate the account.
app.post('/api/invite/redeem', route(async (req, res) => {
  if (!isValidInviteCode(req.body?.code)) return res.status(400).json(INVALID_CODE);
  await markActivated(req.uid);
  res.json({ activated: true });
}));

// Everything below also needs an activated (invited) user.
app.use('/api', requireInvite);

// The browser sends its own local date/time (the server may be in another timezone, e.g. UTC).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const pick = (value, re, fallback) => (typeof value === 'string' && re.test(value) ? value : fallback);

// Today's entries, running totals, and goal.
app.get('/api/today', route(async (req, res) => {
  const date = pick(req.query.date, DATE_RE, todayString());
  const entries = await readEntries(req.uid, date);
  const total = entries.reduce((sum, e) => sum + e.protein_g, 0);
  const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalFiber = entries.reduce((sum, e) => sum + (e.fiber_g || 0), 0);
  res.json({
    date,
    total,
    totalCalories,
    totalFiber,
    goal: await readGoal(req.uid),
    entries,
  });
}));

// Ask the AI for an estimate. Does not save anything.
app.post('/api/estimate', route(async (req, res) => {
  const { text, image } = req.body;
  res.json(await estimateNutrition({ text, image }));
}));

// Save a (possibly user-edited) entry.
app.post('/api/entries', route(async (req, res) => {
  const { description, protein_g, calories, fiber_g, date, time } = req.body;
  const grams = Number(protein_g);
  const cal = Number(calories) || 0;
  const fiber = Number(fiber_g) || 0;
  if (typeof description !== 'string' || !description.trim() || description.length > 200) {
    return res.status(400).json({ error: 'description is required (200 characters max)' });
  }
  if (!Number.isFinite(grams) || grams < 0 || grams > 1000) {
    return res.status(400).json({ error: 'protein_g must be a number between 0 and 1000' });
  }
  if (cal < 0 || cal > 10000) {
    return res.status(400).json({ error: 'calories must be a number between 0 and 10000' });
  }
  if (fiber < 0 || fiber > 300) {
    return res.status(400).json({ error: 'fiber_g must be a number between 0 and 300' });
  }
  const entry = {
    description: description.trim(),
    protein_g: grams,
    calories: cal,
    fiber_g: fiber,
    date: pick(date, DATE_RE, todayString()),
    time: pick(time, TIME_RE, new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
  };
  res.status(201).json(await addEntry(req.uid, entry));
}));

// Today's (or any date's) logged workout sets.
app.get('/api/workouts', route(async (req, res) => {
  const date = pick(req.query.date, DATE_RE, todayString());
  res.json({ date, workouts: await readWorkouts(req.uid, date) });
}));

// Save a workout set: a chosen exercise (from the fixed catalog) with weight and reps.
app.post('/api/workouts', route(async (req, res) => {
  const { category, exercise, weight, reps, date, time } = req.body;
  if (!isValidExercise(category, exercise)) {
    return res.status(400).json({ error: 'Unrecognized category or exercise.' });
  }
  const w = Number(weight);
  const r = Number(reps);
  if (!Number.isFinite(w) || w < 0 || w > 2000) {
    return res.status(400).json({ error: 'weight must be a number between 0 and 2000' });
  }
  if (!Number.isInteger(r) || r < 0 || r > 200) {
    return res.status(400).json({ error: 'reps must be a whole number between 0 and 200' });
  }
  const set = {
    category,
    exercise,
    weight: w,
    reps: r,
    date: pick(date, DATE_RE, todayString()),
    time: pick(time, TIME_RE, new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
  };
  res.status(201).json(await addWorkout(req.uid, set));
}));

// The exercises available for each day type: the user's picks, or the defaults if unset.
app.get('/api/exercise-catalog', route(async (req, res) => {
  const custom = await readExerciseCatalog(req.uid);
  res.json({ catalog: custom ?? EXERCISES, options: EXERCISES });
}));

// Save which exercises (from the fixed master list) belong to each day type.
app.put('/api/exercise-catalog', route(async (req, res) => {
  const catalog = sanitizeCatalog(req.body?.catalog);
  res.json({ catalog: await writeExerciseCatalog(req.uid, catalog) });
}));

// The user's supplement catalog (their personal to-take list, not a per-day log).
app.get('/api/supplements', route(async (req, res) => {
  res.json({ supplements: await readSupplements(req.uid) });
}));

app.post('/api/supplements', route(async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name || name.length > 60) {
    return res.status(400).json({ error: 'name is required (60 characters max)' });
  }
  res.status(201).json({ supplements: await addSupplement(req.uid, name) });
}));

// A POST (not DELETE) so the name travels safely in the body, not a URL path.
app.post('/api/supplements/remove', route(async (req, res) => {
  const name = String(req.body?.name ?? '');
  res.json({ supplements: await removeSupplement(req.uid, name) });
}));

// Which of today's (or any date's) supplements have been checked off.
app.get('/api/supplement-checks', route(async (req, res) => {
  const date = pick(req.query.date, DATE_RE, todayString());
  res.json({ date, taken: await readSupplementChecks(req.uid, date) });
}));

// Check or uncheck one supplement for a day.
app.put('/api/supplement-checks', route(async (req, res) => {
  const name = String(req.body?.name ?? '');
  if (!name) return res.status(400).json({ error: 'name is required' });
  const date = pick(req.body?.date, DATE_RE, todayString());
  await setSupplementCheck(req.uid, date, name, Boolean(req.body?.taken));
  res.json({ ok: true });
}));

app.put('/api/goal', route(async (req, res) => {
  const goal = Number(req.body.goal);
  if (!Number.isFinite(goal) || goal <= 0) {
    return res.status(400).json({ error: 'goal must be a positive number' });
  }
  res.json({ goal: await writeGoal(req.uid, goal) });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
