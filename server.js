import express from 'express';
import path from 'node:path';
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

const app = express();
const PORT = process.env.PORT || 3000;

// Images arrive as base64 in JSON, so allow a generous body size.
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(import.meta.dirname, 'dist')));

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

// Today's entries, running total, and goal.
app.get('/api/today', route(async (req, res) => {
  const date = todayString();
  const entries = (await readEntries(req.uid)).filter((e) => e.date === date);
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
  const { description, protein_g } = req.body;
  const grams = Number(protein_g);
  if (!description || !Number.isFinite(grams) || grams < 0) {
    return res.status(400).json({ error: 'description and a non-negative protein_g are required' });
  }
  res.status(201).json(await addEntry(req.uid, { description, protein_g: grams }));
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

app.listen(PORT, () => {
  console.log(`Protein tracker running at http://localhost:${PORT}`);
});
