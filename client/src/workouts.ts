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

// Collapses sets that repeat the same exercise/weight/reps into one group each, in first-seen
// order, so a row that was logged three times in a row can be shown once with a "×3" pill
// instead of three identical-looking rows.
export function groupSets<T extends { exercise: string; weight: number; reps: number }>(
  sets: T[],
): T[][] {
  const order: string[] = [];
  const groups = new Map<string, T[]>();
  for (const set of sets) {
    const key = `${set.exercise}-${set.weight}-${set.reps}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(set);
  }
  return order.map((key) => groups.get(key)!);
}
