interface Props {
  workoutCategories: string[];
  supplementsTotal: number;
  supplementsTaken: number;
}

// A quick glance at the day's workout and supplements, alongside the meal log.
export default function DaySummary({ workoutCategories, supplementsTotal, supplementsTaken }: Props) {
  const allTaken = supplementsTotal > 0 && supplementsTaken === supplementsTotal;

  return (
    <section className="card day-summary">
      <div className="day-summary-row">
        <span className="day-summary-label">Workout</span>
        <span className="day-summary-value">
          {workoutCategories.length > 0 ? workoutCategories.join(', ') : 'None logged'}
        </span>
      </div>
      <div className="day-summary-row">
        <span className="day-summary-label">Supplements</span>
        <span className={'day-summary-value' + (allTaken ? ' is-complete' : '')}>
          {supplementsTotal === 0
            ? 'None on your list'
            : `${supplementsTaken} of ${supplementsTotal} taken${allTaken ? ' ✓' : ''}`}
        </span>
      </div>
    </section>
  );
}
