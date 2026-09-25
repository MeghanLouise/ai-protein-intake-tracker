import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getToday, saveGoal } from '../api';
import type { TodayResponse } from '../types';
import AddMealForm from './AddMealForm';
import EntryList from './EntryList';
import ProgressSummary from './ProgressSummary';

// The signed-in view: today's progress, the add-meal form and the log.
export default function Tracker() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [error, setError] = useState('');

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

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {today && (
        <div className="layout">
          <div className="column">
            <ProgressSummary total={today.total} goal={today.goal} onGoalChange={changeGoal} />
            <AddMealForm onSaved={refresh} />
          </div>
          <div className="column">
            <EntryList entries={today.entries} />
          </div>
        </div>
      )}
    </>
  );
}
