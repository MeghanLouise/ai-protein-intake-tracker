import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../firebase';
import { menuLabel, PAGES } from '../pages';

interface Props {
  user: User | null;
  // Only set once the tracker is showing, so nav items don't appear during sign-in/invite screens.
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// A slim top bar with the brand and a "More options" overflow menu (nav + account + sign out).
export default function MenuBar({ user, currentPath, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <nav className="menu-bar">
      <div className="menu-bar-inner">
        <span className="brand">
          Wellness <em>Tracker</em>
        </span>
        <div className="menu" ref={menuRef}>
          <button
            type="button"
            className="menu-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="More options"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true">&#8942;</span>
          </button>
          {open && (
            <div className="menu-dropdown" role="menu">
              {currentPath &&
                onNavigate &&
                PAGES.filter((page) => page.path !== currentPath).map((page) => (
                  <button
                    key={page.path}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onNavigate(page.path);
                    }}
                  >
                    {menuLabel(page)}
                  </button>
                ))}
              {user ? (
                <>
                  <p className="menu-account">{user.email ?? user.displayName}</p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      if (auth) signOut(auth);
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <p className="menu-account">Not signed in</p>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
