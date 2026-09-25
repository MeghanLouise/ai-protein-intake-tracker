import express from 'express';
import path from 'node:path';
import { estimateProtein } from './lib/ai.js';
import { addEntry, readEntries, readGoal, todayString, writeGoal } from './lib/storage.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Images arrive as base64 in JSON, so allow a generous body size.
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(import.meta.dirname, 'dist')));

// Wrap async handlers so thrown errors reach the error middleware.
const route = (fn) => (req, res, next) => fn(req, res).catch(next);

// Today's entries, running total, and goal.
app.get('/api/today', route(async (req, res) => {
  const date = todayString();
  const entries = (await readEntries()).filter((e) => e.date === date);
  const total = entries.reduce((sum, e) => sum + e.protein_g, 0);
  res.json({ date, total, goal: await readGoal(), entries });
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
  res.status(201).json(await addEntry({ description, protein_g: grams }));
}));

app.put('/api/goal', route(async (req, res) => {
  const goal = Number(req.body.goal);
  if (!Number.isFinite(goal) || goal <= 0) {
    return res.status(400).json({ error: 'goal must be a positive number' });
  }
  res.json({ goal: await writeGoal(goal) });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Protein tracker running at http://localhost:${PORT}`);
});
