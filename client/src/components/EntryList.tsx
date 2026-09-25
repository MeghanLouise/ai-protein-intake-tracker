import type { Entry } from '../types';

export default function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <section className="entry-log">
      <h2>Today</h2>
      {entries.length === 0 ? (
        <p className="empty">Nothing logged yet.</p>
      ) : (
        <ul>
          {entries.map((e, i) => (
            <li key={`${e.time}-${i}`}>
              <span className="time">{e.time}</span>
              <span className="description">{e.description}</span>
              <span className="grams">{e.protein_g} g</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
