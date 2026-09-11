import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';
import Home from './screens/Home.jsx';
import Auth from './screens/Auth.jsx';
import GameInfo from './screens/GameInfo.jsx';
import Play from './screens/Play.jsx';
import Lobby from './screens/Lobby.jsx';
import Room from './screens/Room.jsx';
import Profile from './screens/Profile.jsx';
import Leaderboard from './screens/Leaderboard.jsx';
import Admin from './screens/Admin.jsx';
import Settings from './screens/Settings.jsx';

function NotFound() {
  return <p className="text-cream/70">That page is not on this table.</p>;
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
        <Route path="/rooms/:code" element={<Protected><Room /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
