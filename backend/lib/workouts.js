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

export function isValidExercise(category, exercise) {
  return EXERCISES[category]?.includes(exercise) ?? false;
}

// Cleans a user-submitted catalog down to: only the 4 known day types, only exercises that are
// really in EXERCISES for that day type, no duplicates. A day type left with nothing selected
// falls back to its full default list, so the dropdown is never empty.
export function sanitizeCatalog(input) {
  const catalog = {};
  for (const category of CATEGORIES) {
    const requested = Array.isArray(input?.[category]) ? input[category] : [];
    const valid = EXERCISES[category].filter((ex) => requested.includes(ex));
    catalog[category] = valid.length > 0 ? valid : EXERCISES[category];
  }
  return catalog;
}
