import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth({ mode }) {
  const { firebaseUser, login, register, loginGoogle, firebaseReady } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (firebaseUser) return <Navigate to={location.state?.from || '/'} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'register') await register(email, password, displayName);
      else await login(email, password);
    } catch (err) {
      setError(err.message || 'Could not sign in');
    }
  }

  return (
    <div className="max-w-md mx-auto paper-card rounded-3xl p-7">
      <h1 className="font-display text-4xl font-bold text-gold tracking-tight">{mode === 'register' ? 'Create an account' : 'Sign in'}</h1>
      {!firebaseReady && (
        <p className="mt-3 text-sm text-ink/50">Firebase keys are missing, so sign-in is disabled.</p>
      )}
      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        {mode === 'register' && (
          <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        )}
        <input className="w-full rounded-lg px-3 py-2 min-h-11" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg px-3 py-2 min-h-11" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-gold">{error}</p>}
        <button type="submit" disabled={!firebaseReady} className="btn btn-primary w-full">
          {mode === 'register' ? 'Register' : 'Sign in'}
        </button>
      </form>
      <button type="button" disabled={!firebaseReady} onClick={() => loginGoogle().catch((err) => setError(err.message))} className="btn btn-ghost w-full mt-3">
        Continue with Google
      </button>
      <p className="mt-4 text-sm text-ink/50">
        {mode === 'register' ? (
          <>Already registered? <Link to="/sign-in" className="text-gold underline-offset-4 hover:underline">Sign in</Link></>
        ) : (
          <>New here? <Link to="/register" className="text-gold underline-offset-4 hover:underline">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
