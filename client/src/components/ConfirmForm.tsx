import { useState } from 'react';
import type { Estimate } from '../types';
import Spinner from './Spinner';

interface Props {
  estimate: Estimate;
  busy: boolean;
  onSave: (description: string, grams: number, calories: number, fiber: number) => void;
  onCancel: () => void;
}

// Lets the user tweak the AI's estimate before it is stored. All three nutrients are always
// editable here, even if a display toggle is off — that only affects what's shown afterward.
export default function ConfirmForm({ estimate, busy, onSave, onCancel }: Props) {
  const [description, setDescription] = useState(estimate.description);
  const [grams, setGrams] = useState(String(estimate.protein_g));
  const [calories, setCalories] = useState(String(estimate.calories));
  const [fiber, setFiber] = useState(String(estimate.fiber_g));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(description, Number(grams), Number(calories), Number(fiber));
  };

  return (
    <form className="confirm-form" onSubmit={submit}>
      <p className="breakdown">{estimate.breakdown}</p>
      <label>
        Meal
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>
      <div className="row-fields">
        <label>
          Protein (g)
          <input
            type="number"
            min="0"
            step="0.1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            required
          />
        </label>
        <label>
          Calories
          <input
            type="number"
            min="0"
            step="1"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
          />
        </label>
        <label>
          Fiber (g)
          <input
            type="number"
            min="0"
            step="0.1"
            value={fiber}
            onChange={(e) => setFiber(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="row">
        <button type="submit" disabled={busy}>
          {busy && <Spinner />}
          Save
        </button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
