import { useState } from 'react';
import type { Estimate } from '../types';

interface Props {
  estimate: Estimate;
  busy: boolean;
  onSave: (description: string, grams: number) => void;
  onCancel: () => void;
}

// Lets the user tweak the AI's estimate before it is stored.
export default function ConfirmForm({ estimate, busy, onSave, onCancel }: Props) {
  const [description, setDescription] = useState(estimate.description);
  const [grams, setGrams] = useState(String(estimate.protein_g));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(description, Number(grams));
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
      <div className="row">
        <button type="submit" disabled={busy}>
          Save
        </button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
