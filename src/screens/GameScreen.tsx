import { useEffect, useRef, useState } from 'react';
import type { GameSession } from '../game/GameSession';
import { ArenaRenderer } from '../game/rendering/ArenaRenderer';
import type { ArenaLoadState } from '../game/rendering/ArenaRenderer';
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

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new ArenaRenderer(host, setLoadState);
    return () => renderer.destroy();
  }, [attempt]);

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

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
        <div className="game-screen__viewport" ref={hostRef} data-testid="arena-viewport" />
        {loadState.kind === 'loading' && (
          <div className="game-screen__loading">
            <p role="status">{loadState.phase === 'assets'
              ? `Loading water texture… ${Math.round(loadState.progress * 100)}%`
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
        <p role={loadState.kind === 'ready' ? 'status' : undefined}>
          {loadState.kind === 'ready' ? 'Arena ready. No match is running.' : 'No match is running.'}
        </p>
        <button type="button" onClick={viewResult}>View Result Placeholder</button>
      </footer>
    </section>
  );
}
