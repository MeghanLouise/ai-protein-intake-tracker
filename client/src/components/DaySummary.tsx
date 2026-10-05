interface Props {
  workoutCategories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  supplementsTotal: number;
  supplementsTaken: number;
}

// A quick glance at the day's workout and supplements, alongside the meal log. Each day type the
// user trained is a chip — click one to see those sets below.
export default function DaySummary({
  workoutCategories,
  selectedCategory,
  onSelectCategory,
  supplementsTotal,
  supplementsTaken,
}: Props) {
  const allTaken = supplementsTotal > 0 && supplementsTaken === supplementsTotal;

  return (
    <section className="card day-summary">
      <div className="day-summary-row">
        <span className="day-summary-label">Workout</span>
        {workoutCategories.length > 0 ? (
          <div className="day-summary-chips">
            {workoutCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={'chip' + (category === selectedCategory ? ' is-selected' : '')}
                aria-pressed={category === selectedCategory}
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <span className="day-summary-value">None logged</span>
        )}
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
