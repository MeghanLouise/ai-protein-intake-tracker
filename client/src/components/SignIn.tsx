import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useState } from 'react';
import { checkInvite, redeemInvite } from '../api';
import { auth } from '../firebase';

// Turn Firebase error codes into friendly messages. Empty string = show nothing.
function friendlyError(err: unknown): string {
  const code = (err as { code?: string }).code;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn\'t enabled in your Firebase project yet.';
    case 'auth/unauthorized-domain':
      return 'This address isn\'t an authorized domain in your Firebase project.';
    default:
      return err instanceof Error ? err.message : String(err);
  }
}

interface Props {
  // Lets the app hold off on showing the invite screen while a new account finishes signing up.
  onSignUpProgress: (inProgress: boolean) => void;
  onActivated: () => void;
}

export default function SignIn({ onSignUpProgress, onActivated }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'signin') return run(() => signInWithEmailAndPassword(auth!, email, password));

    // Sign-up: verify the invite code first so no stray accounts get created, then redeem it.
    run(async () => {
      await checkInvite(inviteCode);
      onSignUpProgress(true);
      try {
        await createUserWithEmailAndPassword(auth!, email, password);
        await redeemInvite(inviteCode);
        onActivated();
      } finally {
        onSignUpProgress(false);
      }
    });
  };

  const google = () => run(() => signInWithPopup(auth!, new GoogleAuthProvider()));

  return (
    <section className="card sign-in">
      <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>

      <button type="button" className="google" onClick={google} disabled={busy}>
        Continue with Google
      </button>

      <p className="divider"><span>or</span></p>

      <form onSubmit={submit}>
        {mode === 'signup' && (
          <label>
            Invite code
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError('');
        }}
      >
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </section>
  );
}
