import { useEffect, useState } from 'react';

// Minimal client-side routing: no library, just the History API. Good enough for a couple of pages.
export function usePath(): [string, (path: string) => void] {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (next: string) => {
    if (next !== window.location.pathname) window.history.pushState({}, '', next);
    setPath(next);
  };

  return [path, navigate];
}
