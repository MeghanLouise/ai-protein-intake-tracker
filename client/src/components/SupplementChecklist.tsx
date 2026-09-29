interface Props {
  supplements: string[];
  taken: string[];
  onToggle: (name: string, taken: boolean) => void;
  onRemove: (name: string) => void;
}

// Today's checklist: one row per supplement in the user's list, checked if already taken today.
export default function SupplementChecklist({ supplements, taken, onToggle, onRemove }: Props) {
  if (supplements.length === 0) {
    return <p className="empty">Nothing on your list yet. Add a supplement to get started.</p>;
  }

  return (
    <ul className="checklist">
      {supplements.map((name) => {
        const checked = taken.includes(name);
        return (
          <li key={name} className={'checklist-item' + (checked ? ' is-checked' : '')}>
            <label className="checklist-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(name, e.target.checked)}
              />
              <span className="checklist-dot" aria-hidden="true" />
              <span className="checklist-name">{name}</span>
            </label>
            <button
              type="button"
              className="link checklist-remove"
              onClick={() => onRemove(name)}
              aria-label={`Remove ${name} from your list`}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}
