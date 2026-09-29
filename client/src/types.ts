// Shapes of the data exchanged with the Express API.

export interface Entry {
  date: string;
  time: string;
  description: string;
  protein_g: number;
  calories: number;
  fiber_g: number;
}

export interface TodayResponse {
  date: string;
  total: number;
  totalCalories: number;
  totalFiber: number;
  goal: number;
  entries: Entry[];
}

export interface Estimate {
  protein_g: number;
  calories: number;
  fiber_g: number;
  description: string;
  breakdown: string;
}

export interface ImagePayload {
  mimeType: string;
  data: string;
}

export interface WorkoutSet {
  date: string;
  time: string;
  category: string;
  exercise: string;
  weight: number;
  reps: number;
}

export interface WorkoutsResponse {
  date: string;
  workouts: WorkoutSet[];
}

// One exercise list per day type, e.g. { 'Push day': ['Bench Press', ...], ... }.
export type ExerciseCatalog = Record<string, string[]>;

export interface ExerciseCatalogResponse {
  catalog: ExerciseCatalog; // the user's current picks (or defaults, if unset)
  options: ExerciseCatalog; // every exercise that could be picked, per day type
}

export interface SupplementsResponse {
  supplements: string[];
}

export interface SupplementChecksResponse {
  date: string;
  taken: string[];
}
