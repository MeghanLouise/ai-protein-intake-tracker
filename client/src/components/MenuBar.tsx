import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../firebase';

// A slim top bar with the brand and a "More options" overflow menu (account + sign out).
export default function MenuBar({ user }: { user: User | null }) {
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
          Protein <em>Tracker</em>
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
