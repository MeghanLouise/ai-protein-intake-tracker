import { useEffect, useState } from 'react';
import { errorMessage, getDay, todayDate } from '../api';
import type { TodayResponse } from '../types';
import EntryList from './EntryList';
import MonthCalendar from './MonthCalendar';
import Spinner from './Spinner';

// A date picker plus that day's totals and log. Reuses the same /api/today endpoint as the
// tracker, which accepts any date, not only today.
export default function CalendarView() {
  const [date, setDate] = useState(todayDate());
  const [day, setDay] = useState<TodayResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDay(null);
    setError('');
    getDay(date)
      .then((d) => !cancelled && setDay(d))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [date]);

  const heading = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="layout">
      <div className="column">
        <section className="card">
          <p className="eyebrow">Calendar view</p>
          <MonthCalendar value={date} max={todayDate()} onChange={setDate} />
          {day ? (
            <div className="totals calendar-totals">
              <span className="total">{Math.round(day.total)}</span>
              <span className="goal-of">of {day.goal} g</span>
            </div>
          ) : !error ? (
            <Spinner label={`Loading ${heading}…`} />
          ) : null}
        </section>
      </div>
      <div className="column">
        {error && <p className="error" role="alert">{error}</p>}
        {day && <EntryList entries={day.entries} title={heading} />}
      </div>
    </div>
  );
}
