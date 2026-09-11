import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getGame } from '../games/registry.js';
import { findRoomByCode, verifyPassword, watchRoom } from '../services/rooms.js';
import { watchMatch } from '../services/matches.js';
import {
  addBot,
  heartbeat,
  playBotIfNeeded,
  playMove,
  removeSeat,
  replaceStaleHumans,
  sitDown,
  startRoom,
} from '../services/roomActions.js';

export default function Room() {
  const { code } = useParams();
  const { firebaseUser, profile } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [match, setMatch] = useState(null);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const joined = useRef(false);

  useEffect(() => {
    let unsub = () => {};
    findRoomByCode(code).then((found) => {
      if (!found) {
        setError('Room not found.');
        return;
      }
      unsub = watchRoom(found.id, setRoom);
    });
    return () => unsub();
  }, [code]);

  useEffect(() => {
    if (!room?.matchId) {
      setMatch(null);
      return undefined;
    }
    return watchMatch(room.matchId, setMatch);
  }, [room?.matchId]);

  const mySeatIndex = useMemo(
    () => room?.seats?.findIndex((seat) => seat.uid === firebaseUser?.uid) ?? -1,
    [room, firebaseUser]
  );
  const isHost = room?.hostId === firebaseUser?.uid;
  const needsPassword = Boolean(room?.passwordHash) && !unlocked && mySeatIndex < 0 && !isHost;

  useEffect(() => {
    if (!room || !profile || needsPassword || joined.current || room.status === 'finished') return;
    joined.current = true;
    sitDown(room, { uid: firebaseUser.uid, displayName: profile.displayName }).catch((err) => setError(err.message));
  }, [room, profile, needsPassword, firebaseUser]);

  useEffect(() => {
    if (!room || mySeatIndex < 0) return undefined;
    const tick = () => heartbeat(room, firebaseUser.uid).catch(() => {});
    tick();
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [room?.id, mySeatIndex, firebaseUser, room]);

  useEffect(() => {
    if (!room || room.status !== 'playing') return undefined;
    const id = setInterval(() => replaceStaleHumans(room).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [room]);

  useEffect(() => {
    if (!match || !room) return;
    playBotIfNeeded(match, room).catch(() => {});
  }, [match?.state?.revision, match?.state?.turn, room?.id]);

  const game = room ? getGame(room.gameId) : null;

  async function onUnlock(event) {
    event.preventDefault();
    const ok = await verifyPassword(room, password);
    if (!ok) {
      setError('Incorrect password.');
      return;
    }
    setUnlocked(true);
    setError('');
  }

  if (error && !room) return <p>{error}</p>;
  if (!room || !game) return <p>Loading room…</p>;

  if (needsPassword) {
    return (
      <form onSubmit={onUnlock} className="max-w-sm bg-walnut p-5 rounded-2xl border border-gold/20">
        <p className="font-display text-2xl text-gold">Password required</p>
        <input className="mt-4 w-full rounded-md px-3 py-2 text-ink" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="mt-2 text-sm">{error}</p>}
        <button type="submit" className="mt-3 bg-gold text-ink font-semibold rounded-md px-4 py-2">Enter</button>
      </form>
    );
  }

  const Board = game.Board;
  const canPlay = room.status === 'playing' && match && !match.result && match.seats[match.state.turn]?.uid === firebaseUser.uid;
  const waitMs = (seat) => {
    if (!seat.disconnectedAt) return null;
    return Math.max(0, 30 - Math.floor((Date.now() - seat.disconnectedAt) / 1000));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section>
        <p className="text-sm text-cream/60">Room <span className="font-mono text-gold">{room.code}</span></p>
        <h1 className="font-display text-3xl text-gold mt-1">{game.meta.title}</h1>
        {room.status === 'playing' && match && (
          <div className="mt-6">
            <Board state={match.state} canPlay={canPlay} onMove={(move) => playMove(match, room, move, firebaseUser.uid).catch((err) => setError(err.message))} />
            <p className="mt-4 text-center text-cream/80">
              {match.result ? (match.result.draw ? 'Draw.' : `${match.seats[match.result.winner]?.name} wins.`) : `${match.seats[match.state.turn]?.name}'s turn`}
            </p>
          </div>
        )}
        {room.status === 'waiting' && (
          <p className="mt-6 text-cream/70">Waiting for the host to start. Fill seats with people or bots.</p>
        )}
        {room.status === 'finished' && match && (
          <div className="mt-6">
            <Board state={match.state} canPlay={false} onMove={() => {}} />
            <button type="button" className="mt-4 text-gold" onClick={() => navigate('/lobby')}>Back to lobby</button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-parchment">{error}</p>}
      </section>
      <aside className="bg-walnut border border-gold/20 rounded-2xl p-4 h-fit">
        <p className="text-xs uppercase tracking-wide text-cream/50">Seats</p>
        <ul className="mt-3 space-y-2">
          {(room.seats || []).map((seat, index) => (
            <li key={index} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {index + 1}. {seat.type === 'empty' ? 'Empty' : seat.name}
                {seat.type === 'bot' ? ' · bot' : ''}
                {waitMs(seat) !== null && seat.type === 'human' ? ` · wait ${waitMs(seat)}s` : ''}
              </span>
              {isHost && room.status === 'waiting' && seat.type !== 'empty' && seat.uid !== firebaseUser.uid && (
                <button type="button" className="text-gold" onClick={() => removeSeat(room, index)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
        {isHost && room.status === 'waiting' && (
          <div className="mt-4 space-y-2">
            <select className="w-full rounded-md px-2 py-1 text-ink" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy bot</option>
              <option value="medium">Medium bot</option>
              <option value="hard">Hard bot</option>
            </select>
            <button type="button" className="w-full border border-gold/40 rounded-md py-1" onClick={() => addBot(room, difficulty)}>Add bot</button>
            <button type="button" className="w-full bg-gold text-ink font-semibold rounded-md py-2" onClick={() => startRoom(room).catch((err) => setError(err.message))}>Start game</button>
          </div>
        )}
        <p className="text-xs uppercase tracking-wide text-cream/50 mt-5">Spectators</p>
        <ul className="mt-2 text-sm text-cream/80">
          {(room.spectators || []).length ? room.spectators.map((s) => <li key={s.uid}>{s.name}</li>) : <li>None</li>}
        </ul>
      </aside>
    </div>
  );
}
