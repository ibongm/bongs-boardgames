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
    <div className="max-w-md mx-auto bg-walnut border border-gold/20 rounded-2xl p-6">
      <h1 className="font-display text-3xl text-gold">{mode === 'register' ? 'Create an account' : 'Sign in'}</h1>
      {!firebaseReady && (
        <p className="mt-3 text-sm text-parchment">Firebase keys are missing, so sign-in is disabled.</p>
      )}
      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        {mode === 'register' && (
          <input className="w-full rounded-md px-3 py-2 text-ink" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        )}
        <input className="w-full rounded-md px-3 py-2 text-ink" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md px-3 py-2 text-ink" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-rust bg-cream/90 rounded px-2 py-1">{error}</p>}
        <button type="submit" disabled={!firebaseReady} className="w-full bg-gold text-ink font-semibold rounded-md py-2">
          {mode === 'register' ? 'Register' : 'Sign in'}
        </button>
      </form>
      <button type="button" disabled={!firebaseReady} onClick={() => loginGoogle().catch((err) => setError(err.message))} className="w-full mt-3 border border-gold/40 rounded-md py-2 text-cream">
        Continue with Google
      </button>
      <p className="mt-4 text-sm text-cream/70">
        {mode === 'register' ? (
          <>Already registered? <Link to="/sign-in" className="text-gold">Sign in</Link></>
        ) : (
          <>New here? <Link to="/register" className="text-gold">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
