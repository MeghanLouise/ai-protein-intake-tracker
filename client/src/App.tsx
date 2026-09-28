import { useEffect, useState } from 'react';
import { errorMessage, getMe } from './api';
import { firebaseConfigured } from './firebase';
import CalendarView from './components/CalendarView';
import InviteGate from './components/InviteGate';
import MenuBar from './components/MenuBar';
import SignIn from './components/SignIn';
import Tracker from './components/Tracker';
import { useAuth } from './useAuth';
import { usePath } from './usePath';

export default function App() {
  const { user, loading } = useAuth();
  const [path, navigate] = usePath();
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
      </section>
    );
  } else if (activated === null || finishingSignUp) {
    content = null;
  } else if (activated) {
    // key resets all state if a different person signs in
    content = path === '/calendar' ? <CalendarView key={user.uid} /> : <Tracker key={user.uid} />;
  } else {
    content = <InviteGate onActivated={() => setActivated(true)} />;
  }

  return (
    <>
      {firebaseConfigured && (
        <MenuBar
          user={user}
          currentPath={activated ? path : undefined}
          onNavigate={navigate}
        />
      )}
      <main className="app">
        <header className="masthead">
          <h1>Protein <em>Tracker</em></h1>
          <p className="date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </header>
        {content}
      </main>
    </>
  );
}
