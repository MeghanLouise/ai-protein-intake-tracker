import { useEffect, useRef, useState } from 'react';
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
}

export default function WorkoutEntryList({
  sets,
  title = "Today's workout",
  onDuplicate,
  duplicating,
  onDelete,
  deleting,
}: Props) {
  // The delete action lives behind this menu (rather than a persistent button next to the
  // repeat "+") so a stray tap near "+" can't remove a set by mistake.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const closeIfOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenuId(null);
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenuId]);

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
              <li key={s.id}>
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
                    onClick={() => onDuplicate(s)}
                  >
                    &#43;
                  </button>
                )}
                {onDelete && (
                  <span className="set-menu" ref={openMenuId === s.id ? menuRef : undefined}>
                    <button
                      type="button"
                      className="set-menu-btn"
                      aria-label={`More actions for ${s.exercise}: ${s.weight} × ${s.reps}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === s.id}
                      onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    >
                      &#8942;
                    </button>
                    {openMenuId === s.id && (
                      <div className="set-menu-popover" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="set-menu-delete"
                          disabled={deleting}
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(newest);
                          }}
                        >
                          Delete set
                        </button>
                      </div>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
