import { useEffect, useState } from 'react';

interface Props {
  value: string; // selected date, YYYY-MM-DD
  max: string; // latest selectable date (inclusive), YYYY-MM-DD — also treated as "today"
  onChange: (date: string) => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d }; // month is 0-based, to match Date
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// A month-grid date picker, styled to match the app instead of the browser's native
// <input type="date">. Dates after `max` are shown but disabled.
export default function MonthCalendar({ value, max, onChange }: Props) {
  const selected = parseISO(value);
  const [view, setView] = useState({ y: selected.y, m: selected.m });

  // Follow `value` if it changes from outside a click in this grid (e.g. a re-mount).
  useEffect(() => {
    setView({ y: selected.y, m: selected.m });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const maxDate = parseISO(max);
  const isAfterMax = (y: number, m: number, d: number) =>
    y > maxDate.y || (y === maxDate.y && (m > maxDate.m || (m === maxDate.m && d > maxDate.d)));

  const startWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const nextMonthDisabled = isAfterMax(view.m === 11 ? view.y + 1 : view.y, (view.m + 1) % 12, 1);

  const goToMonth = (delta: number) => {
    let { y, m } = view;
    m += delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setView({ y, m });
  };

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toISO(view.y, view.m, day), disabled: isAfterMax(view.y, view.m, day) });
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <p className="calendar-month">{monthLabel}</p>
        <button
          type="button"
          className="calendar-nav"
          onClick={() => goToMonth(1)}
          disabled={nextMonthDisabled}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell, i) =>
          cell ? (
            <button
              key={cell.iso}
              type="button"
              className={
                'calendar-day' +
                (cell.iso === value ? ' is-selected' : '') +
                (cell.iso === max ? ' is-today' : '')
              }
              disabled={cell.disabled}
              aria-current={cell.iso === value ? 'date' : undefined}
              onClick={() => onChange(cell.iso)}
            >
              {cell.day}
            </button>
          ) : (
            <span key={`blank-${i}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}
