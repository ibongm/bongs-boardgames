import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getGame } from '../games/registry.js';
import { findRoomByCode, verifyPassword, watchRoom } from '../services/rooms.js';
import { watchMatch } from '../services/matches.js';
import { applyOwnMatchResult } from '../services/stats.js';
import RulesModal from '../components/RulesModal.jsx';
import { useSite } from '../context/SiteContext.jsx';
import {
  addBot,
  heartbeat,
  playBotIfNeeded,
  playMove,
  removeSeat,
  replaceStaleHumans,
  setRoomSeatCount,
  setRoomTestMode,
  sitDown,
  startRoom,
} from '../services/roomActions.js';

export default function Room() {
  const { code } = useParams();
  const { firebaseUser, profile, isAdmin } = useAuth();
  const site = useSite();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [match, setMatch] = useState(null);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [rulesOpen, setRulesOpen] = useState(false);
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
    sitDown(room.id, { uid: firebaseUser?.uid, displayName: profile?.displayName || firebaseUser?.displayName || 'Player' }).catch((err) => setError(err.message));
  }, [room, profile, needsPassword, firebaseUser]);

  useEffect(() => {
    if (!room?.id || mySeatIndex < 0 || !firebaseUser?.uid) return undefined;
    const tick = () => heartbeat(room.id, firebaseUser.uid).catch(() => {});
    tick();
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [room?.id, mySeatIndex, firebaseUser]);

  useEffect(() => {
    if (!room?.id || room.status !== 'playing') return undefined;
    const id = setInterval(() => replaceStaleHumans(room.id).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [room?.id, room?.status]);

  useEffect(() => {
    if (!match || !room) return;
    playBotIfNeeded(match, room).catch(() => {});
  }, [match?.state?.revision, match?.state?.turn, match?.state?.actorSeat, room?.id]);

  useEffect(() => {
    if (!match?.result || !firebaseUser?.uid) return;
    applyOwnMatchResult(match, firebaseUser.uid).catch(() => {});
  }, [match, firebaseUser?.uid]);

  const game = room ? getGame(room.gameId) : null;

  const displayState = useMemo(() => {
    if (!match?.state || !game) return null;
    if (typeof game?.engine?.publicView === 'function') {
      return game.engine.publicView(match.state, mySeatIndex < 0 ? 'spectator' : mySeatIndex);
    }
    return match.state;
  }, [match?.state, game, mySeatIndex]);

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
        <input
          className="mt-4 w-full rounded-md px-3 py-2 text-ink min-h-11"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-2 text-sm">{error}</p>}
        <button type="submit" className="mt-3 bg-gold text-cream font-semibold rounded-md px-4 py-2 min-h-11">
          Enter
        </button>
      </form>
    );
  }

  const Board = game.Board;
  const actorSeat = match?.state?.actorSeat ?? match?.state?.turn;
  const hasOpenTrade = Boolean(
    match?.state?.phase === 'main' &&
    match?.state?.offers?.some((o) => !o.closed && o.fromSeat !== mySeatIndex)
  );
  const isActorTurn = Boolean(
    firebaseUser?.uid && match?.seats?.[actorSeat]?.uid === firebaseUser?.uid
  );
  const canPlay =
    room.status === 'playing' &&
    match &&
    !match.result &&
    Boolean(firebaseUser?.uid) &&
    (isActorTurn || (hasOpenTrade && mySeatIndex >= 0));
  const disconnectSec = Math.round((game?.meta?.disconnectMs || 30000) / 1000);
  const waitMs = (seat) => {
    if (!seat.disconnectedAt) return null;
    return Math.max(0, disconnectSec - Math.floor((Date.now() - seat.disconnectedAt) / 1000));
  };
  const rated = (match?.playerIds || []).length >= 2;
  const minSeats = game.meta.seatsMin || game.meta.seats || 2;
  const maxSeats = game.meta.seatsMax || game.meta.seats || minSeats;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section>
        <p className="text-sm text-ink/70">
          Room <span className="font-mono text-gold">{room.code}</span>
          {rated ? ' · rated' : ' · unrated practice'}
          {mySeatIndex < 0 ? ' · spectating' : ''}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h1 className="font-display text-3xl text-gold">{game.meta.title}</h1>
          {(room.status === 'playing' || room.status === 'finished') && (
            <button type="button" className="border border-gold/40 rounded-md px-3 py-2 text-sm min-h-11" onClick={() => setRulesOpen(true)}>
              Rules
            </button>
          )}
        </div>
        {room.status === 'playing' && match && displayState && (
          <div className="mt-6">
            <Board
              state={displayState}
              canPlay={canPlay}
              viewerSeat={mySeatIndex < 0 ? 'spectator' : mySeatIndex}
              onMove={(move) => playMove(match, room, move, firebaseUser?.uid).catch((err) => setError(err.message))}
            />
            <div className="mt-4 text-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                  match.result
                    ? 'bg-gold/15 text-gold'
                    : isActorTurn
                      ? 'bg-gold text-cream shadow-xs'
                      : 'bg-walnut/70 text-ink/80 border border-gold/20'
                }`}
              >
                {match.result
                  ? match.result.draw
                    ? 'Draw.'
                    : `${match.seats[match.result.winner]?.name || `Player ${match.result.winner + 1}`} wins.`
                  : isActorTurn
                    ? 'Your turn'
                    : `${match.seats[actorSeat]?.name || `Player ${actorSeat + 1}`}'s turn`}
              </div>
            </div>
          </div>
        )}
        {room.status === 'waiting' && (
          <p className="mt-6 text-ink/70">Waiting for the host to start. Fill seats with people or bots.</p>
        )}
        {room.status === 'finished' && match && (
          <div className="mt-6">
            <Board
              state={match.state}
              canPlay={false}
              viewerSeat={mySeatIndex < 0 ? 'spectator' : mySeatIndex}
              onMove={() => {}}
            />
            <button type="button" className="mt-4 text-gold" onClick={() => navigate('/lobby')}>
              Back to lobby
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-parchment">{error}</p>}
      </section>
      <aside className="bg-walnut border border-gold/20 rounded-2xl p-4 h-fit">
        <p className="text-xs uppercase tracking-wide text-ink/55">Seats</p>
        <ul className="mt-3 space-y-2">
          {(room.seats || []).map((seat, index) => (
            <li key={index} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {index + 1}. {seat.type === 'empty' ? 'Empty' : seat.name}
                {seat.type === 'bot' ? ' · bot' : ''}
                {waitMs(seat) !== null && seat.type === 'human' ? ` · wait ${waitMs(seat)}s` : ''}
              </span>
              {isHost && room.status === 'waiting' && seat.type !== 'empty' && seat.uid !== firebaseUser?.uid && (
                <button type="button" className="text-gold" onClick={() => removeSeat(room.id, index)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {(isHost || isAdmin) && (
          <label className="mt-4 flex items-start gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(room.testMode)}
              onChange={(e) => setRoomTestMode(room.id, e.target.checked).catch((err) => setError(err.message))}
            />
            <span>Test table — no disconnect timer. Walk between devices without a bot taking the empty chair.</span>
          </label>
        )}
        {isHost && room.status === 'waiting' && maxSeats > minSeats && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-ink/55 mb-2">Table size</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxSeats - minSeats + 1 }, (_, i) => minSeats + i).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
                    (room.seats || []).length === n ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                  }`}
                  onClick={() => setRoomSeatCount(room.id, n).catch((err) => setError(err.message))}
                >
                  {n}
                </button>
              ))}
            </div>
            {room.gameId === 'citadels' && (
              <p className="mt-2 text-xs text-ink/60">
                {(room.seats || []).length === 6
                  ? '6 players: no face-up discard, one character face down.'
                  : (room.seats || []).length === 5
                    ? '5 players: one face up, one face down.'
                    : '4 players: two face up, one face down.'}
              </p>
            )}
          </div>
        )}
        {isHost && room.status === 'waiting' && (
          <div className="mt-4 space-y-2">
            <select
              className="w-full rounded-md px-2 py-2 text-ink min-h-11"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy bot</option>
              <option value="medium">Medium bot</option>
              <option value="hard">Hard bot</option>
            </select>
            <button type="button" className="w-full border border-gold/40 rounded-md py-2 min-h-11" onClick={() => addBot(room.id, difficulty)}>
              Add bot
            </button>
            <button
              type="button"
              className="w-full bg-gold text-cream font-semibold rounded-md py-2 min-h-11"
              onClick={() => startRoom(room.id).catch((err) => setError(err.message))}
            >
              Start game
            </button>
          </div>
        )}
        <p className="text-xs uppercase tracking-wide text-ink/55 mt-5">Spectators</p>
        <ul className="mt-2 text-sm text-ink/80">
          {(room.spectators || []).length ? room.spectators.map((s) => <li key={s.uid}>{s.name}</li>) : <li>None</li>}
        </ul>
      </aside>
      <RulesModal
        gameId={room.gameId}
        copy={site.games[room.gameId]}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        matchInfo={(match?.seats || room.seats || [])
          .filter((seat) => seat.type !== 'empty')
          .map((seat) => `${seat.name}${seat.type === 'bot' ? ` (${seat.difficulty || 'medium'} bot)` : ''}`)
          .concat([
            room.testMode
              ? 'Test table: disconnect timer is off.'
              : `A leaver is replaced by a Medium bot after ${disconnectSec} seconds.`,
          ])
          .join(' · ')}
      />
      {(room.status === 'playing' || room.status === 'finished') && (
        <div className="fixed bottom-5 right-5 z-30 lg:hidden">
          <button
            type="button"
            className="bg-gold text-cream shadow-table rounded-full px-5 py-3 font-semibold text-sm border border-cream/25 flex items-center gap-1.5"
            onClick={() => setRulesOpen(true)}
          >
            Rules
          </button>
        </div>
      )}
    </div>
  );
}
