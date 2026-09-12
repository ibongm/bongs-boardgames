import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';

const Home = lazy(() => import('./screens/Home.jsx'));
const Auth = lazy(() => import('./screens/Auth.jsx'));
const GameInfo = lazy(() => import('./screens/GameInfo.jsx'));
const Play = lazy(() => import('./screens/Play.jsx'));
const Lobby = lazy(() => import('./screens/Lobby.jsx'));
const Room = lazy(() => import('./screens/Room.jsx'));
const Profile = lazy(() => import('./screens/Profile.jsx'));
const Leaderboard = lazy(() => import('./screens/Leaderboard.jsx'));
const Admin = lazy(() => import('./screens/Admin.jsx'));
const Settings = lazy(() => import('./screens/Settings.jsx'));

function NotFound() {
  return <p className="text-ink/60">That page is not on this table.</p>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/games/:gameId" element={<GameInfo />} />
        <Route path="/play/:gameId" element={<Play />} />
        <Route path="/leaderboards" element={<Leaderboard />} />
        <Route path="/leaderboards/:gameId" element={<Leaderboard />} />
        <Route path="/players/:uid" element={<Profile />} />
        <Route path="/lobby" element={<Protected><Lobby /></Protected>} />
        <Route path="/rooms/:code" element={<Room />} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
