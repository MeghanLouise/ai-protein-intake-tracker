import type { WorkoutSet } from '../types';

interface Props {
  sets: WorkoutSet[];
  title?: string;
}

export default function WorkoutEntryList({ sets, title = "Today's workout" }: Props) {
  return (
    <section className="card entry-log">
      <h2>{title}</h2>
      {sets.length === 0 ? (
        <p className="empty">No sets logged yet. Pick a day type to start.</p>
      ) : (
        <ul>
          {sets.map((s, i) => (
            <li key={`${s.time}-${i}`}>
              <span className="time">{s.time}</span>
              <span className="description">
                {s.exercise}
                <span className="workout-category">{s.category}</span>
              </span>
              <span className="figure">
                {s.weight}&nbsp;&times;&nbsp;{s.reps}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
