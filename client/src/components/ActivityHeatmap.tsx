import { useEffect, useState } from 'react';
import { errorMessage, getWorkoutActivity, todayDate } from '../api';
import type { WorkoutActivityResponse } from '../types';
import Spinner from './Spinner';

const WEEKS = 12;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDateStr = (d: Date) => d.toLocaleDateString('en-CA');

function addDays(dateStr: string, delta: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A GitHub-style "how often have you trained" heatmap, plus a ring showing days trained this
// week, built from the per-day set counts the backend returns for a date range.
export default function ActivityHeatmap() {
  const [activity, setActivity] = useState<WorkoutActivityResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const to = todayDate();
    const todayDow = new Date(`${to}T00:00:00`).getDay();
    const from = addDays(to, -(todayDow + (WEEKS - 1) * 7));
    let cancelled = false;
    getWorkoutActivity(from, to)
      .then((res) => !cancelled && setActivity(res))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  // A broken heatmap shouldn't block logging a set, so it just quietly doesn't render.
  if (error) return null;

  if (!activity) {
    return (
      <section className="card activity-card">
        <Spinner label="Loading your activity…" />
      </section>
    );
  }

  const { to, counts } = activity;
  const todayDow = new Date(`${to}T00:00:00`).getDay();
  const gridStart = addDays(to, -(todayDow + (WEEKS - 1) * 7));

  const columns: { date: string; count: number }[][] = [];
  const monthLabels: string[] = [];
  let lastMonth = -1;
  for (let col = 0; col < WEEKS; col++) {
    const week: { date: string; count: number }[] = [];
    for (let row = 0; row < 7; row++) {
      const date = addDays(gridStart, col * 7 + row);
      week.push({ date, count: date > to ? -1 : counts[date] ?? 0 });
    }
    columns.push(week);
    const firstMonth = new Date(`${week[0].date}T00:00:00`).getMonth();
    monthLabels.push(firstMonth !== lastMonth ? MONTH_NAMES[firstMonth] : '');
    lastMonth = firstMonth;
  }

  let daysThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    if ((counts[addDays(to, -i)] ?? 0) > 0) daysThisWeek++;
  }
  const ringFraction = daysThisWeek / 7;

  return (
    <section className="card activity-card">
      <div className="activity-header">
        <div className="activity-ring" aria-label={`${daysThisWeek} of 7 days trained this week`}>
          <svg viewBox="0 0 64 64">
            <circle className="activity-ring-track" cx="32" cy="32" r={RADIUS} />
            <circle
              className="activity-ring-fill"
              cx="32"
              cy="32"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ringFraction)}
            />
          </svg>
          <span className="activity-ring-value">{daysThisWeek}</span>
        </div>
        <div>
          <p className="activity-title">This week</p>
          <p className="eyebrow">{daysThisWeek} of 7 days trained</p>
        </div>
      </div>
      <div className="heatmap">
        <div className="heatmap-months">
          {monthLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {columns.map((week, col) => (
            <div className="heatmap-col" key={col}>
              {week.map(({ date, count }) =>
                count < 0 ? (
                  <span key={date} className="heatmap-dot is-future" />
                ) : (
                  <span
                    key={date}
                    className={`heatmap-dot level-${levelFor(count)}`}
                    title={`${date}: ${count} set${count === 1 ? '' : 's'}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
