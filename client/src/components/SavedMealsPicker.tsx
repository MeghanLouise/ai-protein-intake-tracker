import { useEffect, useState } from 'react';
import { errorMessage, getSavedMeals } from '../api';
import type { MealTag, SavedMeal } from '../types';
import { MEAL_TAGS } from '../types';

interface Props {
  refreshKey: number;
  onUse: (meal: SavedMeal) => void;
}

// Browse saved meal configurations by tag and reuse one instead of describing it again. All of
// them are fetched once; the tag chips just filter what's already in hand, so switching tags
// doesn't re-hit the server.
export default function SavedMealsPicker({ refreshKey, onUse }: Props) {
  const [tag, setTag] = useState<MealTag | null>(null);
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    getSavedMeals()
      .then((res) => {
        if (active) setMeals(res.savedMeals);
      })
      .catch((err) => {
        if (active) setStatus(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const visible = tag ? meals.filter((m) => m.tag === tag) : meals;

  return (
    <div className="saved-meals">
      <p className="eyebrow">Saved meals</p>
      <div className="saved-meal-tags">
        <button type="button" className={'chip' + (tag === null ? ' is-selected' : '')} onClick={() => setTag(null)}>
          All
        </button>
        {MEAL_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={'chip' + (tag === t ? ' is-selected' : '')}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {status && <p className="status" role="status">{status}</p>}
      {visible.length === 0 ? (
        <p className="empty">No saved meals yet{tag ? ` tagged ${tag}` : ''}.</p>
      ) : (
        <ul className="saved-meal-list">
          {visible.map((m) => (
            <li key={m.id}>
              <button type="button" className="saved-meal-btn" onClick={() => onUse(m)}>
                <span className="saved-meal-name">{m.name}</span>
                <span className="saved-meal-tag">{m.tag}</span>
                <span className="saved-meal-figure">{Math.round(m.protein_g)} g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
