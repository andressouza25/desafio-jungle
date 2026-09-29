import { useEffect, useRef, useState } from 'react';
import type { GameSession } from '../game/GameSession';
import { GameInstance } from '../game/GameInstance';
import type { ArenaLoadState } from '../game/rendering/ArenaRenderer';
import type { LifecycleState } from '../game/GameSession';
import { DEFAULT_GAME_CONFIG } from '../game/config/GameConfig';
import { loadOptions } from '../storage/options';
import { ArtButton } from '../components/ui/ArtButton';

interface GameScreenProps {
  onLeave: () => void;
  onViewResult: () => void;
}

export function GameScreen({ onLeave, onViewResult }: GameScreenProps) {
  const sessionRef = useRef<GameSession | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState<ArenaLoadState>({ kind: 'loading', phase: 'assets', progress: 0 });
  const [lifecycle, setLifecycle] = useState<LifecycleState>('loading');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const instance = new GameInstance(host, {
      readConfig: () => {
        const options = loadOptions();
        return { ...DEFAULT_GAME_CONFIG, session: { durationSeconds: options.sessionDurationSeconds },
          spawn: { ...DEFAULT_GAME_CONFIG.spawn, intervalSeconds: options.enemySpawnIntervalSeconds } };
      },
      onLoad: setLoadState,
      onSnapshot: (snapshot) => setLifecycle(snapshot.state),
    });
    sessionRef.current = instance;
    return () => {
      instance.destroy();
      if (sessionRef.current === instance) sessionRef.current = null;
    };
  }, [attempt]);

  function leaveGame() {
    sessionRef.current?.abandon();
    sessionRef.current?.destroy();
    sessionRef.current = null;
    onLeave();
  }

  function viewResult() {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    onViewResult();
  }

  return (
    <section className="game-screen" aria-labelledby="game-title">
      <header className="game-screen__header">
        <h1 id="game-title">Game</h1>
        <ArtButton type="button" variant="secondary" onClick={leaveGame}>Main Menu</ArtButton>
      </header>
      <div className="game-screen__arena" aria-busy={loadState.kind === 'loading'}>
        <div className="game-screen__viewport" ref={hostRef} data-testid="arena-viewport"
          tabIndex={lifecycle === 'running' ? 0 : -1} role="group" aria-label="Gameplay keyboard controls" aria-describedby="game-controls" />
        {loadState.kind === 'loading' && (
          <div className="game-screen__loading">
            <p role="status">{loadState.phase === 'assets'
              ? `Loading game assets… ${Math.round(loadState.progress * 100)}%`
              : 'Preparing arena…'}</p>
            <progress aria-label="Game assets" value={loadState.progress} max={1} />
          </div>
        )}
        {loadState.kind === 'error' && (
          <div className="game-screen__loading">
            <p role="alert">{loadState.message}</p>
            <ArtButton type="button" onClick={() => setAttempt((current) => current + 1)}>Retry Loading</ArtButton>
          </div>
        )}
      </div>
      <footer className="game-screen__footer">
        <p id="game-controls">W/↑: forward · A/← and D/→: turn · Space/Q/E: attacks (not firing yet) · Esc: pause.
          Keyboard controls require arena focus. Tab returns to page controls.</p>
        <p role={loadState.kind === 'ready' ? 'status' : undefined}>
          {loadState.kind !== 'ready' ? 'No match is running.' : lifecycle === 'ready'
            ? 'Arena ready. No match is running.' : `Match ${lifecycle}.`}
        </p>
        <button type="button" onClick={viewResult}>View Result Placeholder</button>
        {lifecycle === 'ready' && <button type="button" onClick={() => sessionRef.current?.start()}>Start Match</button>}
        {lifecycle === 'running' && <button type="button" onClick={() => sessionRef.current?.pause()}>Pause</button>}
        {lifecycle === 'paused' && <button type="button" onClick={() => sessionRef.current?.resume()}>Resume</button>}
        {(lifecycle === 'running' || lifecycle === 'paused') && <button type="button" onClick={() => sessionRef.current?.end()}>End Match</button>}
        {(lifecycle === 'running' || lifecycle === 'paused' || lifecycle === 'ended') && (
          <button type="button" onClick={() => sessionRef.current?.restart()}>Restart Match</button>
        )}
      </footer>
    </section>
  );
}
