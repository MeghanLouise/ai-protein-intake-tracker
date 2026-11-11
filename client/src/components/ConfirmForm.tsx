import { useState } from 'react';
import type { Estimate, MealTag } from '../types';
import { MEAL_TAGS } from '../types';
import Spinner from './Spinner';

export interface SaveAsMeal {
  name: string;
  tag: MealTag;
}

interface Props {
  estimate: Estimate;
  busy: boolean;
  onSave: (description: string, grams: number, calories: number, fiber: number, saveAsMeal?: SaveAsMeal) => void;
  onCancel: () => void;
}

// Lets the user tweak the AI's estimate before it is stored. All three nutrients are always
// editable here, even if a display toggle is off — that only affects what's shown afterward.
export default function ConfirmForm({ estimate, busy, onSave, onCancel }: Props) {
  const [description, setDescription] = useState(estimate.description);
  const [grams, setGrams] = useState(String(estimate.protein_g));
  const [calories, setCalories] = useState(String(estimate.calories));
  const [fiber, setFiber] = useState(String(estimate.fiber_g));
  const [saveForLater, setSaveForLater] = useState(false);
  const [mealName, setMealName] = useState(estimate.description);
  const [mealTag, setMealTag] = useState<MealTag | ''>('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const saveAsMeal =
      saveForLater && mealTag ? { name: mealName.trim() || description, tag: mealTag } : undefined;
    onSave(description, Number(grams), Number(calories), Number(fiber), saveAsMeal);
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
      <label className="checkbox save-meal-toggle">
        <input
          type="checkbox"
          checked={saveForLater}
          onChange={(e) => setSaveForLater(e.target.checked)}
        />
        <span>Save this meal for later</span>
      </label>
      {saveForLater && (
        <div className="save-meal-fields">
          <label>
            Save as
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              maxLength={60}
              required
            />
          </label>
          <div className="saved-meal-tags">
            {MEAL_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className={'chip' + (mealTag === t ? ' is-selected' : '')}
                onClick={() => setMealTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="row">
        <button type="submit" disabled={busy || (saveForLater && !mealTag)}>
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
