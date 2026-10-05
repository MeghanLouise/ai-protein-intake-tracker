// The fixed workout catalog: one exercise list per day type. Keep this in sync with
// client/src/workouts.ts — the client uses its own copy to fill the dropdown without an extra
// request, and the server uses this one to check that a submitted category/exercise pair is real.
export const EXERCISES = {
  'Push day': [
    'Bench Press',
    'Overhead Press',
    'Incline Dumbbell Press',
    'Weighted Dips',
    'Tricep Pushdown',
    'Lateral Raise',
  ],
  'Pull day': [
    'Deadlift',
    'Pull-Ups',
    'Barbell Row',
    'Lat Pulldown',
    'Seated Cable Row',
    'Bicep Curl',
  ],
  'Leg day': [
    'Back Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Walking Lunges',
    'Leg Curl',
    'Calf Raise',
  ],
  Cardio: ['Running', 'Cycling', 'Rowing Machine', 'Stair Climber', 'Jump Rope', 'Elliptical'],
};

export const CATEGORIES = Object.keys(EXERCISES);

const MAX_PER_CATEGORY = 20;
const MAX_NAME_LENGTH = 60;

// Cleans a user-submitted catalog down to: only the 4 known day types, only well-formed exercise
// names (trimmed, non-empty, reasonable length), no duplicates (case-insensitive), a sensible cap
// per day type. Names don't have to be from the fixed EXERCISES list — a user can add their own.
// A day type left with nothing selected falls back to its full default list, so the dropdown is
// never empty.
export function sanitizeCatalog(input) {
  const catalog = {};
  for (const category of CATEGORIES) {
    const requested = Array.isArray(input?.[category]) ? input[category] : [];
    const cleaned = [];
    const seen = new Set();
    for (const raw of requested) {
      if (typeof raw !== 'string') continue;
      const name = raw.trim();
      if (!name || name.length > MAX_NAME_LENGTH) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(name);
      if (cleaned.length >= MAX_PER_CATEGORY) break;
    }
    catalog[category] = cleaned.length > 0 ? cleaned : EXERCISES[category];
  }
  return catalog;
}
