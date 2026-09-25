import { useState } from 'react';

interface Props {
  total: number;
  goal: number;
  onGoalChange: (goal: number) => void;
}

export default function ProgressSummary({ total, goal, onGoalChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const startEditing = () => {
    setDraft(String(goal));
    setEditing(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onGoalChange(Number(draft));
    setEditing(false);
  };

  return (
    <section className="progress">
      <div className="totals">
        <span className="total">{Math.round(total)}</span> / <span className="goal">{goal}</span> g
      </div>
      <progress value={total} max={goal} />
      {editing ? (
        <form className="goal-form" onSubmit={submit}>
          <label>
            Daily goal (g)
            <input
              type="number"
              min="1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              required
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" className="link" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" className="link" onClick={startEditing}>
          Change goal
        </button>
      )}
    </section>
  );
}
