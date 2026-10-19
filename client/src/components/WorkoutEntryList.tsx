import type { WorkoutSet } from '../types';
import { repeatCounts, repeatKey } from '../workouts';

interface Props {
  sets: WorkoutSet[];
  title?: string;
  // When given, each set gets a button to log another set with the same exercise/weight/reps.
  // Omitted on the calendar view's read-only history, since "repeat" only makes sense for today.
  onDuplicate?: (set: WorkoutSet) => void;
  duplicating?: boolean;
  // When given, each set gets a button to remove it (e.g. one added by mistake).
  onDelete?: (set: WorkoutSet) => void;
  deleting?: boolean;
}

export default function WorkoutEntryList({
  sets,
  title = "Today's workout",
  onDuplicate,
  duplicating,
  onDelete,
  deleting,
}: Props) {
  const counts = repeatCounts(sets);
  return (
    <section className={'card entry-log' + (onDuplicate ? ' has-duplicate' : '')}>
      <h2>{title}</h2>
      {sets.length === 0 ? (
        <p className="empty">No sets logged yet. Pick a day type to start.</p>
      ) : (
        <ul>
          {sets.map((s) => {
            const count = counts.get(repeatKey(s)) ?? 1;
            return (
              <li key={s.id}>
                <span className="time">{s.time}</span>
                <span className="description">
                  {s.exercise}
                  <span className="workout-category">{s.category}</span>
                </span>
                <span className="figure">
                  {s.weight}&nbsp;&times;&nbsp;{s.reps}
                  {count > 1 && <span className="pill">&times;{count}</span>}
                </span>
                {onDuplicate && (
                  <button
                    type="button"
                    className="duplicate-btn"
                    aria-label={`Repeat ${s.exercise}: ${s.weight} × ${s.reps}`}
                    title="Repeat this set"
                    disabled={duplicating}
                    onClick={() => onDuplicate(s)}
                  >
                    &#43;
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="delete-btn"
                    aria-label={`Delete ${s.exercise}: ${s.weight} × ${s.reps}`}
                    title="Delete this set"
                    disabled={deleting}
                    onClick={() => onDelete(s)}
                  >
                    &#215;
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
