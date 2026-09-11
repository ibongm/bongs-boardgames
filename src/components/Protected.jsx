import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Protected({ children, admin = false }) {
  const { firebaseReady, firebaseUser, loading, isAdmin, disabled } = useAuth();
  const location = useLocation();
  if (!firebaseReady) return children;
  if (loading) return <p className="text-ink/50 px-4 py-16 text-center">Loading…</p>;
  if (!firebaseUser) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  if (disabled) {
    return (
      <p className="text-ink/60 px-4 py-16 text-center">
        This account has been disabled. Contact an administrator.
      </p>
    );
  }
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
