import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm min-h-11 inline-flex items-center tracking-wide ${
    isActive ? 'bg-cream/15 text-cream' : 'text-cream/75 hover:text-cream'
  }`;

export default function Header() {
  const site = useSite();
  const { profile, firebaseUser, logout, isAdmin } = useAuth();
  return (
    <header className="bg-gold text-cream sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link to="/" className="font-display text-2xl tracking-tight shrink-0 text-cream">
          {site.homeTitle}
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          <NavLink to="/lobby" className={linkClass}>Lobby</NavLink>
          <NavLink to="/leaderboards" className={linkClass}>Leaderboards</NavLink>
          {firebaseUser && <NavLink to={`/players/${firebaseUser.uid}`} className={linkClass}>Profile</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {firebaseUser ? (
            <>
              <Link to="/settings" className="text-cream/80 hover:text-cream py-2">{profile?.displayName || 'Player'}</Link>
              <button type="button" onClick={logout} className="text-cream py-2 underline-offset-4 hover:underline">Sign out</button>
            </>
          ) : (
            <Link to="/sign-in" className="text-cream py-2 underline-offset-4 hover:underline">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
