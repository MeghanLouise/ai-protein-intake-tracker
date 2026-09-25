import { signOut } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';
import SignIn from './components/SignIn';
import Tracker from './components/Tracker';
import { useAuth } from './useAuth';

export default function App() {
  const { user, loading } = useAuth();

  return (
    <main className="app">
      <header className="masthead">
        <h1>Protein <em>Tracker</em></h1>
        <p className="date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {user && (
          <p className="account">
            {user.email ?? user.displayName}
            {' · '}
            <button type="button" className="link" onClick={() => auth && signOut(auth)}>
              Sign out
            </button>
          </p>
        )}
      </header>

      {!firebaseConfigured ? (
        <section className="card">
          <h2>Finish setting up sign-in</h2>
          <p className="setup">
            Add your Firebase settings to <code>.env</code> (see <code>.env.example</code>), then
            restart the dev server. The README has the steps.
          </p>
        </section>
      ) : loading ? null : user ? (
        // key resets all state if a different person signs in
        <Tracker key={user.uid} />
      ) : (
        <SignIn />
      )}
    </main>
  );
}
