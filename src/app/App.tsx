import { useCallback, useEffect, useRef, useState } from 'react';
import type { Screen } from './navigation';
import { GameScreen } from '../screens/GameScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { OptionsScreen } from '../screens/OptionsScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreens';
import { ResultScreen } from '../screens/ResultScreen';
import { loadLastResult, saveLastResult } from '../storage/lastResult';
import type { MatchResult } from '../game/GameSession';

export function App() {
  const [result, setResult] = useState(loadLastResult);
  const [screen, setScreen] = useState<Screen>(() => result ? 'result' : 'main-menu');
  const [saved, setSaved] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const completeMatch = useCallback((completed: MatchResult) => {
    setResult(completed); setSaved(saveLastResult(completed)); setScreen('result');
  }, []);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [screen]);

  function renderScreen() {
    switch (screen) {
      case 'main-menu':
        return <MainMenuScreen onNavigate={setScreen} />;
      case 'options':
        return <OptionsScreen onBack={() => setScreen('main-menu')} />;
      case 'game':
        return (
          <GameScreen
            onLeave={() => { setAutoStart(false); setScreen('main-menu'); }}
            onViewResult={completeMatch}
            autoStart={autoStart}
          />
        );
      case 'result':
        return result ? <ResultScreen result={result} saved={saved}
          onPlayAgain={() => { setAutoStart(true); setScreen('game'); }} onBack={() => { setAutoStart(false); setScreen('main-menu'); }} /> : null;
      case 'ranking':
        return <PlaceholderScreen title="Ranking" onBack={() => setScreen('main-menu')} />;
      case 'match-history':
        return <PlaceholderScreen title="Match History" onBack={() => setScreen('main-menu')} />;
    }
  }

  return (
    <main ref={mainRef} tabIndex={-1}>
      {renderScreen()}
    </main>
  );
}
