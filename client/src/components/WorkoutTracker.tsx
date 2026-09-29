import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getWorkouts, saveWorkout, todayDate } from '../api';
import type { WorkoutSet } from '../types';
import AddSetForm from './AddSetForm';
import Spinner from './Spinner';
import WorkoutEntryList from './WorkoutEntryList';

// The signed-in workout view: pick a day type and exercise, log sets, see today's log.
export default function WorkoutTracker() {
  const [sets, setSets] = useState<WorkoutSet[] | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setSets((await getWorkouts(todayDate())).workouts);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSet = async (category: string, exercise: string, weight: number, reps: number) => {
    await saveWorkout(category, exercise, weight, reps);
    await refresh();
  };

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {sets ? (
        <div className="layout">
          <div className="column">
            <AddSetForm onAdd={addSet} />
          </div>
          <div className="column">
            <WorkoutEntryList sets={sets} />
          </div>
        </div>
      ) : !error ? (
        <Spinner label="Loading today's workout…" />
      ) : null}
    </>
  );
}
