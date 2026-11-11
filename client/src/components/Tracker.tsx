import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getToday, saveGoal, updateEntry } from '../api';
import type { Entry, TodayResponse } from '../types';
import { usePreferences } from '../usePreferences';
import AddMealForm from './AddMealForm';
import EntryList from './EntryList';
import ProgressSummary from './ProgressSummary';
import Spinner from './Spinner';

// The signed-in view: today's progress, the add-meal form and the log.
export default function Tracker() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [error, setError] = useState('');
  const { prefs, toggle } = usePreferences();

  const refresh = useCallback(async () => {
    try {
      setToday(await getToday());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const changeGoal = async (goal: number) => {
    try {
      await saveGoal(goal);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const editEntry = async (entry: Entry, description: string, grams: number, calories: number, fiber: number) => {
    await updateEntry(entry.id, description, grams, calories, fiber);
    await refresh();
  };

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {today ? (
        <div className="layout">
          <div className="column">
            <ProgressSummary
              total={today.total}
              goal={today.goal}
              calories={today.totalCalories}
              fiber={today.totalFiber}
              prefs={prefs}
              onToggle={toggle}
              onGoalChange={changeGoal}
            />
            <AddMealForm onSaved={refresh} />
          </div>
          <div className="column">
            <EntryList
              entries={today.entries}
              showCalories={prefs.showCalories}
              showFiber={prefs.showFiber}
              onUpdate={editEntry}
            />
          </div>
        </div>
      ) : !error ? (
        <Spinner label="Loading today's log…" />
      ) : null}
    </>
  );
}
