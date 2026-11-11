import { useState } from 'react';
import type { Entry } from '../types';
import Spinner from './Spinner';

interface Props {
  entry: Entry;
  busy: boolean;
  onSave: (description: string, grams: number, calories: number, fiber: number) => void;
  onCancel: () => void;
}

// Lets the user correct a previously logged meal. Mirrors ConfirmForm's fields, since both edit
// the same protein/calories/fiber shape, just starting from a stored entry instead of an estimate.
export default function EditMealForm({ entry, busy, onSave, onCancel }: Props) {
  const [description, setDescription] = useState(entry.description);
  const [grams, setGrams] = useState(String(entry.protein_g));
  const [calories, setCalories] = useState(String(entry.calories));
  const [fiber, setFiber] = useState(String(entry.fiber_g));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(description, Number(grams), Number(calories), Number(fiber));
  };

  return (
    <form className="confirm-form" onSubmit={submit}>
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
        <button type="button" className="link" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
