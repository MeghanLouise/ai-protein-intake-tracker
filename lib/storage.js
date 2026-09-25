// Flat-file storage, one folder per user: data/users/<uid>/entries.csv and goal.json.
import fs from 'node:fs/promises';
import path from 'node:path';

const USERS_DIR = path.join(import.meta.dirname, '..', 'data', 'users');

const HEADER = 'date,time,description,protein_g\n';
const DEFAULT_GOAL = 100;

// The uid comes from a verified Firebase token, but it becomes a folder name, so double-check it.
function userPaths(uid) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid user id');
  const dir = path.join(USERS_DIR, uid);
  return {
    dir,
    entriesFile: path.join(dir, 'entries.csv'),
    goalFile: path.join(dir, 'goal.json'),
  };
}

// Local calendar date as YYYY-MM-DD.
export function todayString() {
  return new Date().toLocaleDateString('en-CA');
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

// Minimal CSV line parser that handles quoted fields and "" escapes.
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { fields.push(cur); cur = ''; }
    else cur += c;
  }
  fields.push(cur);
  return fields;
}

async function ensureEntriesFile({ dir, entriesFile }) {
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(entriesFile);
  } catch {
    await fs.writeFile(entriesFile, HEADER);
  }
}

export async function readEntries(uid) {
  const paths = userPaths(uid);
  await ensureEntriesFile(paths);
  const text = await fs.readFile(paths.entriesFile, 'utf8');
  return text
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map(parseCsvLine)
    .map(([date, time, description, protein]) => ({
      date,
      time,
      description,
      protein_g: Number(protein),
    }));
}

export async function addEntry(uid, { description, protein_g }) {
  const paths = userPaths(uid);
  await ensureEntriesFile(paths);
  const now = new Date();
  const entry = {
    date: todayString(),
    time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    description: description.replaceAll('\n', ' '),
    protein_g,
  };
  const row = [entry.date, entry.time, csvEscape(entry.description), entry.protein_g].join(',');
  await fs.appendFile(paths.entriesFile, row + '\n');
  return entry;
}

export async function readGoal(uid) {
  try {
    const { goal } = JSON.parse(await fs.readFile(userPaths(uid).goalFile, 'utf8'));
    return goal;
  } catch {
    return DEFAULT_GOAL;
  }
}

export async function writeGoal(uid, goal) {
  const { dir, goalFile } = userPaths(uid);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(goalFile, JSON.stringify({ goal }, null, 2) + '\n');
  return goal;
}
