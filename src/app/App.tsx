import { useEffect, useRef, useState } from 'react';
import type { Screen } from './navigation';
import { GameScreen } from '../screens/GameScreen';
import {
  MainMenuScreen,
  PlaceholderScreen,
  ResultScreen,
} from '../screens/PlaceholderScreens';

export function App() {
  const [screen, setScreen] = useState<Screen>('main-menu');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [screen]);

  function renderScreen() {
    switch (screen) {
      case 'main-menu':
        return <MainMenuScreen onNavigate={setScreen} />;
      case 'options':
        return <PlaceholderScreen title="Options" onBack={() => setScreen('main-menu')} />;
      case 'game':
        return (
          <GameScreen
            onLeave={() => setScreen('main-menu')}
            onViewResult={() => setScreen('result')}
          />
        );
      case 'result':
        return <ResultScreen onPlayAgain={() => setScreen('game')} onBack={() => setScreen('main-menu')} />;
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
