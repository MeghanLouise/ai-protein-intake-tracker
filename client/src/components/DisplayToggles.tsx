import type { Preferences } from '../usePreferences';

interface Props {
  prefs: Preferences;
  onToggle: (key: keyof Preferences) => void;
}

interface SwitchProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

// A sliding on/off switch, label on the left. The real checkbox stays for accessibility
// (focus, keyboard, screen readers) but is visually replaced by the track + thumb.
function ToggleSwitch({ checked, label, onChange }: SwitchProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <span className={'switch' + (checked ? ' is-on' : '')}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </span>
    </label>
  );
}

// Lets the user pick which extra nutrients show up in totals and the log.
export default function DisplayToggles({ prefs, onToggle }: Props) {
  return (
    <div className="display-toggles" role="group" aria-label="Also show">
      <p className="toggle-heading">Also show</p>
      <ToggleSwitch
        checked={prefs.showCalories}
        label="Calories"
        onChange={() => onToggle('showCalories')}
      />
      <ToggleSwitch checked={prefs.showFiber} label="Fiber" onChange={() => onToggle('showFiber')} />
    </div>
  );
}
