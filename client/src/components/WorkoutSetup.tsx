import { useEffect, useState } from 'react';
import { errorMessage, getExerciseCatalog, saveExerciseCatalog } from '../api';
import type { ExerciseCatalog } from '../types';
import { CATEGORIES } from '../workouts';
import Spinner from './Spinner';

const MAX_PER_CATEGORY = 20; // keep in sync with backend/lib/workouts.js

// Lets a user pick which exercises show up under each day type, and add their own. `options` is
// the fixed master list (from the server); `selected` is which of those, plus which custom
// names, are currently turned on for each day.
export default function WorkoutSetup() {
  const [options, setOptions] = useState<ExerciseCatalog | null>(null);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getExerciseCatalog()
      .then(({ catalog, options }) => {
        setOptions(options);
        setSelected(
          Object.fromEntries(CATEGORIES.map((c) => [c, new Set(catalog[c] ?? options[c])])),
        );
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // The checkboxes shown for a day: the fixed options, plus any custom exercises already added
  // to it (so a custom one you've added stays visible, and unchecking it simply drops it).
  const itemsFor = (category: string) => {
    const base = options?.[category] ?? [];
    const extra = [...(selected[category] ?? [])].filter((ex) => !base.includes(ex));
    return [...base, ...extra];
  };

  const toggle = (category: string, exercise: string) => {
    setSelected((prev) => {
      const next = new Set(prev[category]);
      // Keep at least one exercise selected per day, so the tracker's dropdown is never empty.
      if (next.has(exercise)) {
        if (next.size === 1) return prev;
        next.delete(exercise);
      } else {
        next.add(exercise);
      }
      return { ...prev, [category]: next };
    });
    setStatus('');
  };

  const addCustom = (category: string, event: React.FormEvent) => {
    event.preventDefault();
    const raw = (drafts[category] ?? '').trim();
    if (!raw) return;

    const items = itemsFor(category);
    if (items.length >= MAX_PER_CATEGORY) {
      setStatus(`${category} already has ${MAX_PER_CATEGORY} exercises, the most allowed.`);
      return;
    }
    // Reuse the existing name's casing if this is a match, rather than adding a near-duplicate.
    const existing = items.find((ex) => ex.toLowerCase() === raw.toLowerCase());

    setSelected((prev) => ({
      ...prev,
      [category]: new Set(prev[category]).add(existing ?? raw),
    }));
    setDrafts((prev) => ({ ...prev, [category]: '' }));
    setStatus('');
  };

  const save = async () => {
    setBusy(true);
    setStatus('');
    try {
      const catalog = Object.fromEntries(CATEGORIES.map((c) => [c, [...(selected[c] ?? [])]]));
      await saveExerciseCatalog(catalog);
      setStatus('Saved.');
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!options) return <Spinner label="Loading your exercises…" />;

  return (
    <section className="card workout-setup">
      <h2>Set up your workouts</h2>
      <p className="setup">Choose which exercises show up under each day type, or add your own.</p>
      {CATEGORIES.map((category) => (
        <fieldset key={category} className="exercise-group">
          <legend>{category}</legend>
          <div className="checkbox-grid">
            {itemsFor(category).map((exercise) => (
              <label key={exercise} className="checkbox">
                <input
                  type="checkbox"
                  checked={selected[category]?.has(exercise) ?? false}
                  onChange={() => toggle(category, exercise)}
                />
                {exercise}
              </label>
            ))}
          </div>
          <form className="add-exercise-row" onSubmit={(e) => addCustom(category, e)}>
            <input
              type="text"
              placeholder="Add your own exercise"
              value={drafts[category] ?? ''}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [category]: e.target.value }))}
              maxLength={60}
            />
            <button type="submit">Add</button>
          </form>
        </fieldset>
      ))}
      <div className="row">
        <button type="button" onClick={save} disabled={busy}>
          {busy && <Spinner />}
          Save
        </button>
        <p className="status" role="status">{status}</p>
      </div>
    </section>
  );
}
