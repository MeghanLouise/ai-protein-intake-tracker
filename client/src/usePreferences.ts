import { useEffect, useState } from 'react';

export interface Preferences {
  showCalories: boolean;
  showFiber: boolean;
}

const KEY = 'protein-tracker:preferences';
const DEFAULTS: Preferences = { showCalories: true, showFiber: true };

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// Which extra nutrients to show, alongside protein. A per-device display preference (not synced
// across devices or accounts), so plain localStorage is enough — no server round trip needed.
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // e.g. private browsing with storage blocked — the toggle still works for this visit
    }
  }, [prefs]);

  const toggle = (key: keyof Preferences) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return { prefs, toggle };
}
