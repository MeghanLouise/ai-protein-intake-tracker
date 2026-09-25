import { useState } from 'react';

interface Props {
  total: number;
  goal: number;
  onGoalChange: (goal: number) => void;
}

export default function ProgressSummary({ total, goal, onGoalChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const percent = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;
  const remaining = Math.max(0, Math.round(goal - total));

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
    <section className="card progress">
      <p className="eyebrow">Today's protein</p>
      <div className="totals">
        <span className="total">{Math.round(total)}</span>
        <span className="goal-of">of {goal} g</span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.round(total)}
      >
        <div className="bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="remaining">{remaining > 0 ? `${remaining} g to go` : 'Goal reached'}</p>
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
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="link" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="link" onClick={startEditing}>
          Change goal
        </button>
      )}
    </section>
  );
}
