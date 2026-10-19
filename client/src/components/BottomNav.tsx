import type { ReactElement } from 'react';

interface Props {
  // Only set once the tracker is showing, same as MenuBar — no nav during sign-in/invite screens.
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// Simple line icons, drawn inline so this stays dependency-free. Same viewBox/stroke so they
// line up with each other regardless of which one is active.
const ICONS: Record<string, ReactElement> = {
  '/': (
    <path d="M4 11.5 12 5l8 6.5M6 10v8.5a1 1 0 0 0 1 1h3.5v-5a1.5 1.5 0 0 1 1.5-1.5v0a1.5 1.5 0 0 1 1.5 1.5v5H17a1 1 0 0 0 1-1V10" />
  ),
  '/calendar': (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  '/workout': (
    <path d="M6.5 9v6M4 10.5v3M17.5 9v6M20 10.5v3M8.5 12h7" />
  ),
  '/supplements': (
    <g transform="rotate(45 12 12)">
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M12 9v6" />
    </g>
  ),
};

const LABELS: Record<string, string> = {
  '/': 'Today',
  '/calendar': 'Calendar',
  '/workout': 'Workout',
  '/supplements': 'Supplements',
};

const PATHS = ['/', '/calendar', '/workout', '/supplements'];

// A floating row of circular icon buttons for the 4 main pages, shown only at phone widths —
// the sticky top bar's "more" menu still covers workout setup and the account/sign-out actions.
export default function BottomNav({ currentPath, onNavigate }: Props) {
  if (!currentPath || !onNavigate) return null;

  return (
    <nav className="bottom-nav" aria-label="Main">
      {PATHS.map((path) => {
        const isActive = path === currentPath;
        return (
          <button
            key={path}
            type="button"
            className={'bottom-nav-btn' + (isActive ? ' is-active' : '')}
            aria-label={LABELS[path]}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(path)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {ICONS[path]}
            </svg>
          </button>
        );
      })}
    </nav>
  );
}
