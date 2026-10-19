import { useEffect, useState } from 'react';
import { errorMessage, getLastWorkout } from '../api';
import type { ExerciseCatalog, LastWorkoutResponse, WorkoutSet } from '../types';
import { CATEGORIES, groupSets } from '../workouts';
import Spinner from './Spinner';

interface Props {
  // The user's chosen exercises per day type (see WorkoutSetup); falls back to the app defaults.
  catalog: ExerciseCatalog;
  onAdd: (category: string, exercise: string, weight: number, reps: number) => Promise<void>;
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// What was logged for this exercise last time this day type came up, filtered down to just that
// exercise so switching the dropdown doesn't dump the whole previous session on the screen.
function LastSession({
  date,
  exercise,
  workouts,
}: {
  date: string | null;
  exercise: string;
  workouts: WorkoutSet[];
}) {
  if (!date) return <div className="last-session"><p className="eyebrow">No previous sets logged yet</p></div>;

  const matching = workouts.filter((w) => w.exercise === exercise);
  if (matching.length === 0) {
    return (
      <div className="last-session">
        <p className="eyebrow">No previous {exercise.toLowerCase()} logged yet</p>
      </div>
    );
  }

  return (
    <div className="last-session">
      <p className="eyebrow">Last {exercise} · {formatDate(date)}</p>
      <ul className="last-session-list">
        {groupSets(matching).map((group) => {
          const w = group[0];
          return (
            <li key={`${w.weight}-${w.reps}`}>
              <span className="figure">
                {w.weight}&nbsp;&times;&nbsp;{w.reps}
                {group.length > 1 && <span className="pill">&times;{group.length}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Pick a day type, pick an exercise from that day's list, log the weight and reps.
export default function AddSetForm({ catalog, onAdd }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // What was logged last time this day type came up, for reference while filling in today's.
  const [lastSession, setLastSession] = useState<LastWorkoutResponse | null>(null);
  const [lastLoading, setLastLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setLastSession(null);
      return;
    }
    let cancelled = false;
    setLastSession(null);
    setLastLoading(true);
    getLastWorkout(category)
      .then((res) => !cancelled && setLastSession(res))
      .catch(() => !cancelled && setLastSession({ date: null, workouts: [] }))
      .finally(() => !cancelled && setLastLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  // Also how you switch day types later: the grid stays visible and clickable once one is picked.
  // The exercise itself is left unset so the previous-workout box stays hidden until they pick one.
  const pickCategory = (next: string) => {
    setCategory(next);
    setExercise('');
    setStatus('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !exercise) return;
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || w < 0) return setStatus('Enter a valid weight.');
    if (!Number.isInteger(r) || r < 0) return setStatus('Enter a whole number of reps.');

    setBusy(true);
    setStatus('');
    try {
      await onAdd(category, exercise, w, r);
      setWeight('');
      setReps('');
      setStatus(`Added ${exercise}.`);
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card add-workout">
      <h2>Log a set</h2>
      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={'category-btn' + (c === category ? ' is-selected' : '')}
            onClick={() => pickCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {category && (
        <form onSubmit={submit}>
          <label>
            Exercise
            <select value={exercise} onChange={(e) => setExercise(e.target.value)} required>
              <option value="" disabled>
                Choose an exercise
              </option>
              {catalog[category].map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </label>
          {exercise &&
            (lastLoading ? (
              <div className="last-session">
                <Spinner label={`Loading your last ${exercise.toLowerCase()}…`} />
              </div>
            ) : (
              <LastSession date={lastSession?.date ?? null} exercise={exercise} workouts={lastSession?.workouts ?? []} />
            ))}
          <div className="row-fields">
            <label>
              Weight (kg)
              <input
                type="number"
                min="0"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </label>
            <label>
              Reps
              <input
                type="number"
                min="0"
                step="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" disabled={busy}>
            {busy && <Spinner />}
            Add set
          </button>
        </form>
      )}
      <p className="status" role="status">{status}</p>
    </section>
  );
}
