import { useState } from 'react';
import { errorMessage } from '../api';
import type { ExerciseCatalog } from '../types';
import { CATEGORIES } from '../workouts';
import Spinner from './Spinner';

interface Props {
  // The user's chosen exercises per day type (see WorkoutSetup); falls back to the app defaults.
  catalog: ExerciseCatalog;
  onAdd: (category: string, exercise: string, weight: number, reps: number) => Promise<void>;
}

// Pick a day type, pick an exercise from that day's list, log the weight and reps.
export default function AddSetForm({ catalog, onAdd }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // Also how you switch day types later: the grid stays visible and clickable once one is picked.
  const pickCategory = (next: string) => {
    setCategory(next);
    setExercise(catalog[next][0]);
    setStatus('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category) return;
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
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              {catalog[category].map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </label>
          <div className="row-fields">
            <label>
              Weight (kg)
              <input
                type="number"
                min="0"
                step="0.5"
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
