// The fixed workout catalog, for the UI. Keep this in sync with backend/lib/workouts.js, which
// the server uses to validate that a submitted category/exercise pair is real.
export const EXERCISES: Record<string, string[]> = {
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

// How many times each weight/reps combo shows up in a list of sets, e.g. for a "×3" pill next
// to a set that was repeated. Keyed by "weight-reps" so 0 and "0" can't collide with lookups.
export function repeatCounts(sets: { weight: number; reps: number }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { weight, reps } of sets) {
    const key = `${weight}-${reps}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export const repeatKey = (set: { weight: number; reps: number }) => `${set.weight}-${set.reps}`;
