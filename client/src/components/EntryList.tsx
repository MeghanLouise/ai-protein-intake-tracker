import { useState } from 'react';
import type { Entry } from '../types';
import EditMealForm from './EditMealForm';

interface Props {
  entries: Entry[];
  title?: string;
  showCalories?: boolean;
  showFiber?: boolean;
  // When given, entries become clickable to open an edit form in place of that row.
  onUpdate?: (entry: Entry, description: string, grams: number, calories: number, fiber: number) => Promise<void>;
}

export default function EntryList({ entries, title = "Today's log", showCalories, showFiber, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (entry: Entry, description: string, grams: number, calories: number, fiber: number) => {
    if (!onUpdate) return;
    setBusy(true);
    setError('');
    try {
      await onUpdate(entry, description, grams, calories, fiber);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card entry-log">
      <h2>{title}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {entries.length === 0 ? (
        <p className="empty">Nothing logged yet. Start with breakfast.</p>
      ) : (
        <ul>
          {entries.map((e, i) => {
            const key = e.id || `${e.time}-${i}`;
            if (onUpdate && editingId === key) {
              return (
                <li key={key} className="editing">
                  <EditMealForm
                    entry={e}
                    busy={busy}
                    onSave={(description, grams, calories, fiber) => save(e, description, grams, calories, fiber)}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              );
            }
            const clickable = Boolean(onUpdate);
            return (
              <li
                key={key}
                className={clickable ? 'clickable' : undefined}
                onClick={clickable ? () => setEditingId(key) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setEditingId(key);
                        }
                      }
                    : undefined
                }
              >
                <span className="time">{e.time}</span>
                <span className="description">{e.description}</span>
                <span className="stats">
                  <span className="figure">{e.protein_g} g</span>
                  {showCalories && <span className="stat-chip">{Math.round(e.calories)} cal</span>}
                  {showFiber && <span className="stat-chip">{Math.round(e.fiber_g)} g fiber</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
