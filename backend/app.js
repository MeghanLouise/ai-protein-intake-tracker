import express from 'express';
import { estimateProtein } from './lib/ai.js';
import { requireAuth } from './lib/auth.js';
import { isValidInviteCode, requireInvite } from './lib/invites.js';
import {
  addEntry,
  isActivated,
  markActivated,
  readEntries,
  readGoal,
  todayString,
  writeGoal,
} from './lib/storage.js';

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

// Today's entries, running total, and goal.
app.get('/api/today', route(async (req, res) => {
  const date = pick(req.query.date, DATE_RE, todayString());
  const entries = await readEntries(req.uid, date);
  const total = entries.reduce((sum, e) => sum + e.protein_g, 0);
  res.json({ date, total, goal: await readGoal(req.uid), entries });
}));

// Ask the AI for an estimate. Does not save anything.
app.post('/api/estimate', route(async (req, res) => {
  const { text, image } = req.body;
  res.json(await estimateProtein({ text, image }));
}));

// Save a (possibly user-edited) entry.
app.post('/api/entries', route(async (req, res) => {
  const { description, protein_g, date, time } = req.body;
  const grams = Number(protein_g);
  if (typeof description !== 'string' || !description.trim() || description.length > 200) {
    return res.status(400).json({ error: 'description is required (200 characters max)' });
  }
  if (!Number.isFinite(grams) || grams < 0 || grams > 1000) {
    return res.status(400).json({ error: 'protein_g must be a number between 0 and 1000' });
  }
  const entry = {
    description: description.trim(),
    protein_g: grams,
    date: pick(date, DATE_RE, todayString()),
    time: pick(time, TIME_RE, new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
  };
  res.status(201).json(await addEntry(req.uid, entry));
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
