import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

const linkClass = ({ isActive }) =>
  `px-2 py-1 rounded-md text-sm ${isActive ? 'bg-gold/20 text-gold' : 'text-cream/80 hover:text-cream'}`;

export default function Header() {
  const site = useSite();
  const { profile, firebaseUser, logout, isAdmin } = useAuth();
  return (
    <header className="border-b border-gold/20 bg-walnut/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link to="/" className="font-display text-xl text-gold shrink-0">
          {site.homeTitle}
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          <NavLink to="/lobby" className={linkClass}>Lobby</NavLink>
          <NavLink to="/leaderboards" className={linkClass}>Leaderboards</NavLink>
          {firebaseUser && <NavLink to={`/players/${firebaseUser.uid}`} className={linkClass}>Profile</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {firebaseUser ? (
            <>
              <Link to="/settings" className="text-cream/80 hover:text-cream">{profile?.displayName || 'Player'}</Link>
              <button type="button" onClick={logout} className="text-gold hover:underline">Sign out</button>
            </>
          ) : (
            <Link to="/sign-in" className="text-gold hover:underline">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
