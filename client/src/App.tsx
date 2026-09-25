import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getToday, saveGoal } from './api';
import AddMealForm from './components/AddMealForm';
import EntryList from './components/EntryList';
import ProgressSummary from './components/ProgressSummary';
import type { TodayResponse } from './types';

export default function App() {
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
    <main className="app">
      <h1>Protein Tracker</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {today && (
        <>
          <ProgressSummary total={today.total} goal={today.goal} onGoalChange={changeGoal} />
          <AddMealForm onSaved={refresh} />
          <EntryList entries={today.entries} />
        </>
      )}
    </main>
  );
}
