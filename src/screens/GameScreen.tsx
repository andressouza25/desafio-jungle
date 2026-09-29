import { useEffect, useRef } from 'react';
import type { GameSession } from '../game/GameSession';

interface GameScreenProps {
  onLeave: () => void;
  onViewResult: () => void;
}

export function GameScreen({ onLeave, onViewResult }: GameScreenProps) {
  const sessionRef = useRef<GameSession | null>(null);

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
    <>
      <h1>Game</h1>
      <p>Game screen placeholder. No match is running.</p>
      <button type="button" onClick={viewResult}>View Result Placeholder</button>{' '}
      <button type="button" onClick={leaveGame}>Main Menu</button>
    </>
  );
}
