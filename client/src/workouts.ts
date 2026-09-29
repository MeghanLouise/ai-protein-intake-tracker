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
