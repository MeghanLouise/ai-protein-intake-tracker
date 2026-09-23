// Flat-file storage: entries live in a CSV, the goal in a small JSON file.
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.csv');
const GOAL_FILE = path.join(DATA_DIR, 'goal.json');

const HEADER = 'date,time,description,protein_g\n';
const DEFAULT_GOAL = 100;

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

async function ensureEntriesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ENTRIES_FILE);
  } catch {
    await fs.writeFile(ENTRIES_FILE, HEADER);
  }
}

export async function readEntries() {
  await ensureEntriesFile();
  const text = await fs.readFile(ENTRIES_FILE, 'utf8');
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

export async function addEntry({ description, protein_g }) {
  await ensureEntriesFile();
  const now = new Date();
  const entry = {
    date: todayString(),
    time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    description: description.replaceAll('\n', ' '),
    protein_g,
  };
  const row = [entry.date, entry.time, csvEscape(entry.description), entry.protein_g].join(',');
  await fs.appendFile(ENTRIES_FILE, row + '\n');
  return entry;
}

export async function readGoal() {
  try {
    const { goal } = JSON.parse(await fs.readFile(GOAL_FILE, 'utf8'));
    return goal;
  } catch {
    return DEFAULT_GOAL;
  }
}

export async function writeGoal(goal) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(GOAL_FILE, JSON.stringify({ goal }, null, 2) + '\n');
  return goal;
}
