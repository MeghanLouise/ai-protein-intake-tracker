import { useEffect, useMemo, useState } from 'react';
import { errorMessage, getWorkoutHistory, getWorkoutInsight } from '../api';
import type { WorkoutInsight, WorkoutSet } from '../types';
import Spinner from './Spinner';
import WeightChart from './WeightChart';

// The signed-in progress view: pick a previously-logged exercise and see its weight trend over
// time, plus on-demand AI feedback on training trends.
export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutSet[] | null>(null);
  const [error, setError] = useState('');
  const [exercise, setExercise] = useState('');

  const [insight, setInsight] = useState<WorkoutInsight | null>(null);
  const [insightError, setInsightError] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    getWorkoutHistory()
      .then((res) => {
        setWorkouts(res.workouts);
        if (res.workouts.length > 0) setExercise(res.workouts[res.workouts.length - 1].exercise);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const exercises = useMemo(() => {
    if (!workouts) return [];
    return [...new Set(workouts.map((w) => w.exercise))].sort((a, b) => a.localeCompare(b));
  }, [workouts]);

  // One point per date: the heaviest set logged that day for this exercise, since that's the
  // figure that best tracks progressive overload.
  const points = useMemo(() => {
    if (!workouts || !exercise) return [];
    const heaviestByDate = new Map<string, number>();
    for (const w of workouts) {
      if (w.exercise !== exercise) continue;
      heaviestByDate.set(w.date, Math.max(heaviestByDate.get(w.date) ?? 0, w.weight));
    }
    return [...heaviestByDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, weight]) => ({ date, weight }));
  }, [workouts, exercise]);

  const requestInsight = async () => {
    setInsightLoading(true);
    setInsightError('');
    try {
      setInsight(await getWorkoutInsight(exercise || undefined));
    } catch (err) {
      setInsightError(errorMessage(err));
    } finally {
      setInsightLoading(false);
    }
  };

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!workouts) return <Spinner label="Loading your progress…" />;

  return (
    <>
      <section className="card">
        <h2>Progress</h2>
        {exercises.length === 0 ? (
          <p className="eyebrow">Log a few sets on the Workout page to see your progress here.</p>
        ) : (
          <label>
            Exercise
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              {exercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {exercise && (
        <section className="card">
          <h3>{exercise}</h3>
          {points.length > 1 ? (
            <WeightChart points={points} />
          ) : (
            <p className="eyebrow">Log {exercise.toLowerCase()} on another day to see a trend line.</p>
          )}
        </section>
      )}

      {exercises.length > 0 && (
        <section className="card insight-card">
          <h3>AI insights</h3>
          <button type="button" onClick={requestInsight} disabled={insightLoading}>
            {insightLoading && <Spinner />}
            {insightLoading ? 'Thinking…' : insight ? 'Refresh insight' : 'Get insight'}
          </button>
          {insightError && <p className="error" role="alert">{insightError}</p>}
          {insight && (
            <dl className="insight-list">
              <div>
                <dt>Improving</dt>
                <dd>{insight.improving}</dd>
              </div>
              <div>
                <dt>Focus on</dt>
                <dd>{insight.focus}</dd>
              </div>
              {insight.missing && (
                <div>
                  <dt>Might be missing</dt>
                  <dd>{insight.missing}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      )}
    </>
  );
}
