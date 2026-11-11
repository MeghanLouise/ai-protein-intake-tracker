import { useEffect, useState } from 'react';
import {
  errorMessage,
  getDay,
  getSupplementChecks,
  getSupplements,
  getWorkouts,
  todayDate,
} from '../api';
import type { TodayResponse, WorkoutSet } from '../types';
import { usePreferences } from '../usePreferences';
import DayDetail from './DayDetail';
import DaySummary from './DaySummary';
import DisplayToggles from './DisplayToggles';
import EntryList from './EntryList';
import MonthCalendar from './MonthCalendar';
import Spinner from './Spinner';
import WorkoutEntryList from './WorkoutEntryList';

// A date picker plus that day's totals and log. Reuses the same /api/today endpoint as the
// tracker, which accepts any date, not only today. Clicking a logged meal or set opens a
// day-detail view, scoped to the selected date, where that day's log can be edited.
export default function CalendarView() {
  const [date, setDate] = useState(todayDate());
  const [day, setDay] = useState<TodayResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSet[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [supplementsTotal, setSupplementsTotal] = useState(0);
  const [supplementsTaken, setSupplementsTaken] = useState(0);
  const [error, setError] = useState('');
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
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
    setWorkouts(null);
    setSelectedCategory(null); // the previous selection may not exist on the new date
    setError('');
    Promise.all([getDay(date), getWorkouts(date), getSupplementChecks(date)])
      .then(([dayRes, workoutsRes, checksRes]) => {
        if (cancelled) return;
        setDay(dayRes);
        setWorkouts(workoutsRes.workouts);
        setSupplementsTaken(checksRes.taken.length);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [date, refreshToken]);

  const heading = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const workoutCategories = workouts ? [...new Set(workouts.map((w) => w.category))] : [];
  const selectedSets = workouts?.filter((w) => w.category === selectedCategory) ?? [];

  if (editingDate) {
    return (
      <DayDetail
        date={editingDate}
        onBack={() => {
          setEditingDate(null);
          setRefreshToken((c) => c + 1); // edits may have changed this day's totals
        }}
      />
    );
  }

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
        {workouts && (
          <DaySummary
            workoutCategories={workoutCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) =>
              setSelectedCategory((prev) => (prev === category ? null : category))
            }
            supplementsTotal={supplementsTotal}
            supplementsTaken={supplementsTaken}
          />
        )}
        {selectedCategory && (
          <WorkoutEntryList
            sets={selectedSets}
            title={`${selectedCategory} · ${heading}`}
            onEntryClick={() => setEditingDate(date)}
          />
        )}
        {day && (
          <EntryList
            entries={day.entries}
            title={heading}
            showCalories={prefs.showCalories}
            showFiber={prefs.showFiber}
            onEntryClick={() => setEditingDate(date)}
          />
        )}
      </div>
    </div>
  );
}
