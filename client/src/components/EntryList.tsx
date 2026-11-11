import type { Entry } from '../types';

interface Props {
  entries: Entry[];
  title?: string;
  showCalories?: boolean;
  showFiber?: boolean;
  // When given, each row becomes clickable (e.g. the calendar's day-detail edit view) instead of
  // being plain read-only history.
  onEntryClick?: () => void;
}

export default function EntryList({
  entries,
  title = "Today's log",
  showCalories,
  showFiber,
  onEntryClick,
}: Props) {
  return (
    <section className="card entry-log">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="empty">Nothing logged yet. Start with breakfast.</p>
      ) : (
        <ul>
          {entries.map((e, i) => (
            <li
              key={e.id ?? `${e.time}-${i}`}
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
              <span className="time">{e.time}</span>
              <span className="description">{e.description}</span>
              <span className="stats">
                <span className="figure">{e.protein_g} g</span>
                {showCalories && <span className="stat-chip">{Math.round(e.calories)} cal</span>}
                {showFiber && <span className="stat-chip">{Math.round(e.fiber_g)} g fiber</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
