import type { WorkoutSet } from '../types';
import { groupSets } from '../workouts';

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
  // When given, each row becomes clickable (e.g. the calendar's day-detail edit view) instead of
  // being plain read-only history.
  onEntryClick?: () => void;
}

export default function WorkoutEntryList({
  sets,
  title = "Today's workout",
  onDuplicate,
  duplicating,
  onDelete,
  deleting,
  onEntryClick,
}: Props) {
  return (
    <section className={'card entry-log' + (onDuplicate ? ' has-duplicate' : '')}>
      <h2>{title}</h2>
      {sets.length === 0 ? (
        <p className="empty">No sets logged yet. Pick a day type to start.</p>
      ) : (
        <ul>
          {groupSets(sets).map((group) => {
            const s = group[0];
            // Deleting a repeated row removes just the newest one logged, not the whole group.
            const newest = group[group.length - 1];
            return (
              <li
                key={s.id}
                className={onEntryClick ? 'is-clickable' : undefined}
                role={onEntryClick ? 'button' : undefined}
                tabIndex={onEntryClick ? 0 : undefined}
                onClick={onEntryClick}
                onKeyDown={
                  onEntryClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onEntryClick();
                        }
                      }
                    : undefined
                }
              >
                <span className="time">{s.time}</span>
                <span className="description">
                  {s.exercise}
                  <span className="workout-category">{s.category}</span>
                </span>
                <span className="figure">
                  {s.weight}&nbsp;&times;&nbsp;{s.reps}
                  {group.length > 1 && <span className="pill">&times;{group.length}</span>}
                </span>
                {onDuplicate && (
                  <button
                    type="button"
                    className="duplicate-btn"
                    aria-label={`Repeat ${s.exercise}: ${s.weight} × ${s.reps}`}
                    title="Repeat this set"
                    disabled={duplicating}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicate(s);
                    }}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(newest);
                    }}
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
