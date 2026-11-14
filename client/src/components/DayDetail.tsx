import { useCallback, useEffect, useState } from 'react';
import {
  deleteEntry,
  deleteWorkout,
  errorMessage,
  getDay,
  getExerciseCatalog,
  getWorkouts,
  updateEntry,
  updateWorkout,
} from '../api';
import type { Entry, ExerciseCatalog, TodayResponse, WorkoutSet } from '../types';
import Spinner from './Spinner';

interface Props {
  date: string; // YYYY-MM-DD
  onBack: () => void;
}

const formatHeading = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

// An editable row for one logged meal: description, protein, calories and fiber, matching the
// fields AddMealForm's ConfirmForm lets you set when a meal is first saved.
function EditEntryRow({
  entry,
  busy,
  onSave,
  onCancel,
}: {
  entry: Entry;
  busy: boolean;
  onSave: (description: string, protein_g: number, calories: number, fiber_g: number) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(entry.description);
  const [grams, setGrams] = useState(String(entry.protein_g));
  const [calories, setCalories] = useState(String(entry.calories));
  const [fiber, setFiber] = useState(String(entry.fiber_g));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(description, Number(grams), Number(calories), Number(fiber));
  };

  return (
    <li className="entry-edit-row">
      <form onSubmit={submit}>
        <label>
          Meal
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <div className="row-fields">
          <label>
            Protein (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              required
            />
          </label>
          <label>
            Calories
            <input
              type="number"
              min="0"
              step="1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
          </label>
          <label>
            Fiber (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy && <Spinner />}
            Save
          </button>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}

// An editable row for one logged set: exercise (limited to this day type's catalog), weight and
// reps. The day type itself isn't editable — delete and re-add the set to move it to another one.
function EditSetRow({
  set,
  exercises,
  busy,
  onSave,
  onCancel,
}: {
  set: WorkoutSet;
  exercises: string[];
  busy: boolean;
  onSave: (exercise: string, weight: number, reps: number) => void;
  onCancel: () => void;
}) {
  const [exercise, setExercise] = useState(set.exercise);
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(exercise, Number(weight), Number(reps));
  };

  return (
    <li className="entry-edit-row">
      <form onSubmit={submit}>
        <label>
          Exercise
          <select value={exercise} onChange={(e) => setExercise(e.target.value)} required>
            {/* The currently logged exercise might not be in the catalog anymore (e.g. it was
                later removed from the day type), so it's always offered alongside the catalog. */}
            {!exercises.includes(set.exercise) && <option value={set.exercise}>{set.exercise}</option>}
            {exercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </label>
        <div className="row-fields">
          <label>
            Weight (kg)
            <input type="number" min="0" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} required />
          </label>
          <label>
            Reps
            <input type="number" min="0" step="1" value={reps} onChange={(e) => setReps(e.target.value)} required />
          </label>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy && <Spinner />}
            Save
          </button>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}

// The day-detail view reached by clicking a logged meal or workout on the calendar: shows every
// meal and set logged that day with an edit/delete action on each, and a way back to the
// calendar. Edits persist to Firestore immediately (there's no separate "save the whole day"
// step); "Cancel" on a row just discards that row's in-progress edit, not anything already saved.
export default function DayDetail({ date, onBack }: Props) {
  const [day, setDay] = useState<TodayResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSet[] | null>(null);
  const [catalog, setCatalog] = useState<ExerciseCatalog | null>(null);
  const [error, setError] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setError('');
    return Promise.all([getDay(date), getWorkouts(date), getExerciseCatalog()])
      .then(([dayRes, workoutsRes, catalogRes]) => {
        setDay(dayRes);
        setWorkouts(workoutsRes.workouts);
        setCatalog(catalogRes.catalog);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [date]);

  useEffect(() => {
    setDay(null);
    setWorkouts(null);
    setCatalog(null);
    setEditingEntryId(null);
    setEditingSetId(null);
    refresh();
  }, [refresh]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveEntry = (
    entry: Entry,
    description: string,
    protein_g: number,
    calories: number,
    fiber_g: number,
  ) =>
    run(async () => {
      await updateEntry(entry.id, description, protein_g, calories, fiber_g);
      setEditingEntryId(null);
    });

  const removeEntry = (entry: Entry) =>
    run(async () => {
      await deleteEntry(entry.id);
    });

  const saveSet = (set: WorkoutSet, exercise: string, weight: number, reps: number) =>
    run(async () => {
      await updateWorkout(set.id, set.category, exercise, weight, reps);
      setEditingSetId(null);
    });

  const removeSet = (set: WorkoutSet) =>
    run(async () => {
      await deleteWorkout(set.id);
    });

  const loaded = day && workouts && catalog;

  return (
    <div className="column day-detail">
      <section className="card day-detail-header">
        <button type="button" className="link back-link" onClick={onBack}>
          &#8249; Back to calendar
        </button>
        <h2>{formatHeading(date)}</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      {!loaded && !error ? (
        <Spinner label="Loading…" />
      ) : loaded ? (
        <>
          <section className="card entry-log has-edit">
            <h2>Meals</h2>
            {day.entries.length === 0 ? (
              <p className="empty">Nothing logged this day.</p>
            ) : (
              <ul>
                {day.entries.map((entry) =>
                  editingEntryId === entry.id ? (
                    <EditEntryRow
                      key={entry.id}
                      entry={entry}
                      busy={busy}
                      onSave={(description, protein_g, calories, fiber_g) =>
                        saveEntry(entry, description, protein_g, calories, fiber_g)
                      }
                      onCancel={() => setEditingEntryId(null)}
                    />
                  ) : (
                    <li key={entry.id}>
                      <span className="time">{entry.time}</span>
                      <span className="description">{entry.description}</span>
                      <span className="stats">
                        <span className="figure">{entry.protein_g} g</span>
                      </span>
                      <button
                        type="button"
                        className="edit-btn"
                        aria-label={`Edit ${entry.description}`}
                        title="Edit this meal"
                        disabled={busy}
                        onClick={() => setEditingEntryId(entry.id)}
                      >
                        &#9998;
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        aria-label={`Delete ${entry.description}`}
                        title="Delete this meal"
                        disabled={busy}
                        onClick={() => removeEntry(entry)}
                      >
                        &#215;
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
          <section className="card entry-log has-edit">
            <h2>Workouts</h2>
            {workouts.length === 0 ? (
              <p className="empty">No sets logged this day.</p>
            ) : (
              <ul>
                {workouts.map((set) =>
                  editingSetId === set.id ? (
                    <EditSetRow
                      key={set.id}
                      set={set}
                      exercises={catalog[set.category] ?? [set.exercise]}
                      busy={busy}
                      onSave={(exercise, weight, reps) => saveSet(set, exercise, weight, reps)}
                      onCancel={() => setEditingSetId(null)}
                    />
                  ) : (
                    <li key={set.id}>
                      <span className="time">{set.time}</span>
                      <span className="description">
                        {set.exercise}
                        <span className="workout-category">{set.category}</span>
                      </span>
                      <span className="figure">
                        {set.weight}&nbsp;&times;&nbsp;{set.reps}
                      </span>
                      <button
                        type="button"
                        className="edit-btn"
                        aria-label={`Edit ${set.exercise}`}
                        title="Edit this set"
                        disabled={busy}
                        onClick={() => setEditingSetId(set.id)}
                      >
                        &#9998;
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        aria-label={`Delete ${set.exercise}`}
                        title="Delete this set"
                        disabled={busy}
                        onClick={() => removeSet(set)}
                      >
                        &#215;
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
