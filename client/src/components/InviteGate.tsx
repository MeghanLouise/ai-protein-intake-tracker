import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { errorMessage, redeemInvite } from '../api';
import { auth } from '../firebase';

// Shown to signed-in users who haven't redeemed an invite code yet (e.g. new Google sign-ins).
export default function InviteGate({ onActivated }: { onActivated: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await redeemInvite(code);
      onActivated();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <section className="card sign-in">
      <h2>Enter your invite code</h2>
      <p className="setup">This app is invite-only right now. Enter the code you were given to continue.</p>
      <form onSubmit={submit}>
        <label>
          Invite code
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          Continue
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="link" onClick={() => auth && signOut(auth)}>
        Sign out
      </button>
    </section>
  );
}
