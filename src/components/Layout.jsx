import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { firebaseReady } from '../lib/firebase.js';

export default function Layout() {
  const site = useSite();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {!firebaseReady && (
        <div className="bg-rust/30 text-ink text-sm px-4 py-2 text-center">
          Firebase is not configured yet. Accounts and rooms need environment variables. See the README.
        </div>
      )}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gold/20 text-ink/70 text-sm px-4 py-6 text-center">{site.footer}</footer>
    </div>
  );
}
