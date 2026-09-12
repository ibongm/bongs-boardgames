import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm min-h-11 inline-flex items-center ${
    isActive ? 'bg-cream/15 text-cream font-semibold' : 'text-cream/90 hover:text-cream'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2.5 rounded-lg text-sm min-h-11 flex items-center ${
    isActive ? 'bg-cream/20 text-cream font-semibold' : 'text-cream/90 hover:bg-cream/10'
  }`;

export default function Header() {
  const site = useSite();
  const { profile, firebaseUser, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="border-b border-cream/15 bg-gold sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" onClick={closeMenu} className="font-display text-xl text-cream shrink-0">
          {site.homeTitle}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/lobby" className={linkClass}>Lobby</NavLink>
          <NavLink to="/leaderboards" className={linkClass}>Leaderboards</NavLink>
          {firebaseUser && <NavLink to={`/players/${firebaseUser.uid}`} className={linkClass}>Profile</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        {/* Desktop User actions */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          {firebaseUser ? (
            <>
              <Link to="/settings" className="text-cream/90 hover:text-cream py-2 font-medium">
                {profile?.displayName || 'Player'}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-cream/80 hover:text-cream py-2 underline-offset-4 hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/sign-in" className="text-cream font-medium hover:underline py-2">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          {firebaseUser ? (
            <Link
              to="/settings"
              onClick={closeMenu}
              className="text-xs text-cream/90 bg-cream/15 px-2.5 py-1.5 rounded-full font-medium max-w-[120px] truncate"
            >
              {profile?.displayName || 'Player'}
            </Link>
          ) : (
            <Link to="/sign-in" onClick={closeMenu} className="text-xs text-cream/90 hover:text-cream px-2 py-1 font-medium">
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="p-2 text-cream rounded-md hover:bg-cream/15 min-h-11 min-w-11 flex items-center justify-center"
          >
            <svg
              className="w-6 h-6 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-cream/15 bg-gold px-4 py-3 space-y-1">
          <NavLink to="/lobby" onClick={closeMenu} className={mobileLinkClass}>
            Lobby
          </NavLink>
          <NavLink to="/leaderboards" onClick={closeMenu} className={mobileLinkClass}>
            Leaderboards
          </NavLink>
          {firebaseUser && (
            <NavLink to={`/players/${firebaseUser.uid}`} onClick={closeMenu} className={mobileLinkClass}>
              Profile
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu} className={mobileLinkClass}>
              Admin
            </NavLink>
          )}
          {firebaseUser && (
            <NavLink to="/settings" onClick={closeMenu} className={mobileLinkClass}>
              Settings
            </NavLink>
          )}
          {firebaseUser && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-cream/80 hover:text-cream hover:bg-cream/10 rounded-lg min-h-11 flex items-center"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
