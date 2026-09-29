import { useEffect, useState } from 'react';
import {
  errorMessage,
  getDay,
  getSupplementChecks,
  getSupplements,
  getWorkouts,
  todayDate,
} from '../api';
import type { TodayResponse } from '../types';
import { usePreferences } from '../usePreferences';
import DaySummary from './DaySummary';
import DisplayToggles from './DisplayToggles';
import EntryList from './EntryList';
import MonthCalendar from './MonthCalendar';
import Spinner from './Spinner';

// A date picker plus that day's totals and log. Reuses the same /api/today endpoint as the
// tracker, which accepts any date, not only today.
export default function CalendarView() {
  const [date, setDate] = useState(todayDate());
  const [day, setDay] = useState<TodayResponse | null>(null);
  const [workoutCategories, setWorkoutCategories] = useState<string[] | null>(null);
  const [supplementsTotal, setSupplementsTotal] = useState(0);
  const [supplementsTaken, setSupplementsTaken] = useState(0);
  const [error, setError] = useState('');
  const { prefs, toggle } = usePreferences();

  // The supplement catalog doesn't depend on the selected date, so it's fetched once.
  useEffect(() => {
    getSupplements()
      .then((res) => setSupplementsTotal(res.supplements.length))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDay(null);
    setWorkoutCategories(null);
    setError('');
    Promise.all([getDay(date), getWorkouts(date), getSupplementChecks(date)])
      .then(([dayRes, workoutsRes, checksRes]) => {
        if (cancelled) return;
        setDay(dayRes);
        setWorkoutCategories([...new Set(workoutsRes.workouts.map((w) => w.category))]);
        setSupplementsTaken(checksRes.taken.length);
      })
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
            <>
              <div className="totals calendar-totals">
                <span className="total">{Math.round(day.total)}</span>
                <span className="goal-of">of {day.goal} g</span>
              </div>
              {(prefs.showCalories || prefs.showFiber) && (
                <p className="extra-stats">
                  {prefs.showCalories && <span>{Math.round(day.totalCalories)} cal</span>}
                  {prefs.showFiber && <span>{Math.round(day.totalFiber)} g fiber</span>}
                </p>
              )}
              <DisplayToggles prefs={prefs} onToggle={toggle} />
            </>
          ) : !error ? (
            <Spinner label={`Loading ${heading}…`} />
          ) : null}
        </section>
      </div>
      <div className="column">
        {error && <p className="error" role="alert">{error}</p>}
        {workoutCategories && (
          <DaySummary
            workoutCategories={workoutCategories}
            supplementsTotal={supplementsTotal}
            supplementsTaken={supplementsTaken}
          />
        )}
        {day && (
          <EntryList
            entries={day.entries}
            title={heading}
            showCalories={prefs.showCalories}
            showFiber={prefs.showFiber}
          />
        )}
      </div>
    </div>
  );
}
