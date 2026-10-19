import { useCallback, useEffect, useState } from 'react';
import { deleteWorkout, errorMessage, getExerciseCatalog, getWorkouts, saveWorkout, todayDate } from '../api';
import type { ExerciseCatalog, WorkoutSet } from '../types';
import ActivityHeatmap from './ActivityHeatmap';
import AddSetForm from './AddSetForm';
import Spinner from './Spinner';
import WorkoutEntryList from './WorkoutEntryList';

// The signed-in workout view: pick a day type and exercise, log sets, see today's log.
export default function WorkoutTracker() {
  const [sets, setSets] = useState<WorkoutSet[] | null>(null);
  const [catalog, setCatalog] = useState<ExerciseCatalog | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  // Bumped on every refresh so <ActivityHeatmap> (which only fetches once on mount) remounts and
  // picks up today's latest count after a set is added, duplicated, or deleted.
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [today, exercises] = await Promise.all([getWorkouts(todayDate()), getExerciseCatalog()]);
      setSets(today.workouts);
      setCatalog(exercises.catalog);
      setError('');
      setRefreshCount((c) => c + 1);
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

  // One click to log another set with the same exercise, weight and reps as an existing one.
  const duplicateSet = async (set: WorkoutSet) => {
    setDuplicating(true);
    setError('');
    try {
      await addSet(set.category, set.exercise, set.weight, set.reps);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDuplicating(false);
    }
  };

  // Remove a set added by mistake.
  const deleteSet = async (set: WorkoutSet) => {
    setDeleting(true);
    setError('');
    try {
      await deleteWorkout(set.id);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {sets && catalog ? (
        <div className="layout">
          <div className="column">
            <AddSetForm catalog={catalog} onAdd={addSet} />
          </div>
          <div className="column">
            <WorkoutEntryList
              sets={sets}
              onDuplicate={duplicateSet}
              duplicating={duplicating}
              onDelete={deleteSet}
              deleting={deleting}
            />
          </div>
        </div>
      ) : !error ? (
        <Spinner label="Loading today's workout…" />
      ) : null}
      {sets && catalog && <ActivityHeatmap key={refreshCount} />}
    </>
  );
}
