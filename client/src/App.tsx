import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { errorMessage, getMe } from './api';
import { auth, firebaseConfigured } from './firebase';
import InviteGate from './components/InviteGate';
import SignIn from './components/SignIn';
import Tracker from './components/Tracker';
import { useAuth } from './useAuth';

export default function App() {
  const { user, loading } = useAuth();
  // null = still checking. Once true it stays true for this sign-in.
  const [activated, setActivated] = useState<boolean | null>(null);
  const [finishingSignUp, setFinishingSignUp] = useState(false);
  const [loadError, setLoadError] = useState('');

  const uid = user?.uid;
  useEffect(() => {
    setActivated(null);
    setLoadError('');
    if (!uid) return;
    getMe()
      .then((me) => setActivated((prev) => prev || me.activated))
      .catch((err) => setLoadError(errorMessage(err)));
  }, [uid]);

  let content;
  if (!firebaseConfigured) {
    content = (
      <section className="card">
        <h2>Finish setting up sign-in</h2>
        <p className="setup">
          Add your Firebase settings to <code>.env</code> (see <code>.env.example</code>), then
          restart the dev server. The README has the steps.
        </p>
      </section>
    );
  } else if (loading) {
    content = null;
  } else if (!user) {
    content = (
      <SignIn onSignUpProgress={setFinishingSignUp} onActivated={() => setActivated(true)} />
    );
  } else if (loadError && activated !== true) {
    content = (
      <section className="card sign-in">
        <h2>Something went wrong</h2>
        <p className="error" role="alert">{loadError}</p>
        <button type="button" className="link" onClick={() => auth && signOut(auth)}>
          Sign out
        </button>
      </section>
    );
  } else if (activated === null || finishingSignUp) {
    content = null;
  } else if (activated) {
    // key resets all state if a different person signs in
    content = <Tracker key={user.uid} />;
  } else {
    content = <InviteGate onActivated={() => setActivated(true)} />;
  }

  return (
    <main className="app">
      <header className="masthead">
        <h1>Protein <em>Tracker</em></h1>
        <p className="date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {user && activated && (
          <p className="account">
            {user.email ?? user.displayName}
            {' · '}
            <button type="button" className="link" onClick={() => auth && signOut(auth)}>
              Sign out
            </button>
          </p>
        )}
      </header>
      {content}
    </main>
  );
}
