import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Screen } from './navigation';
import { GameScreen } from '../screens/GameScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { OptionsScreen } from '../screens/OptionsScreen';
import { RankingScreen, HistoryScreen } from '../screens/CaptainsLog';
import { ResultScreen } from '../screens/ResultScreen';
import { loadLastResult, saveLastResult } from '../storage/lastResult';
import { parseMatch, type MatchRecord } from '../api/contracts';
import { SubmissionRecovery } from '../api/SubmissionRecovery';
import { browserRecordStorage } from '../storage/mockRecords';
import { PendingSubmissions } from '../screens/PendingSubmissions';

export function App() {
  const client = useQueryClient();
  const [recovery] = useState(() => new SubmissionRecovery(client, browserRecordStorage()));
  const pending = useSyncExternalStore(recovery.subscribe, recovery.getSnapshot);
  const [result, setResult] = useState(loadLastResult);
  const [screen, setScreen] = useState<Screen>(() => result ? 'result' : 'main-menu');
  const [saved, setSaved] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const completeMatch = useCallback((completed: MatchRecord) => {
    recovery.enqueue(completed);
    setResult(completed); setSaved(saveLastResult(completed)); setScreen('result');
    void recovery.retry(completed.matchId);
  }, [recovery]);
  const mainRef = useRef<HTMLElement>(null);
  const pendingRegistrations = <PendingSubmissions items={pending} durable={recovery.isDurable()}
    onRetry={(matchId) => { void recovery.retry(matchId); }} />;

  useEffect(() => {
    mainRef.current?.focus();
  }, [screen]);

  function renderScreen() {
    switch (screen) {
      case 'main-menu':
        return <MainMenuScreen onNavigate={setScreen} pendingRegistrations={pendingRegistrations} />;
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
      case 'result': {
        const record = parseMatch(result);
        return result ? <ResultScreen result={result} saved={saved}
          registration={record ? recovery.state(record.matchId) : undefined}
          pendingRegistrations={pendingRegistrations}
          onPlayAgain={() => { setAutoStart(true); setScreen('game'); }} onBack={() => { setAutoStart(false); setScreen('main-menu'); }} /> : null;
      }
      case 'ranking':
        return <RankingScreen onBack={() => setScreen('main-menu')} onSwitch={() => setScreen('match-history')} />;
      case 'match-history':
        return <HistoryScreen onBack={() => setScreen('main-menu')} onSwitch={() => setScreen('ranking')} />;
    }
  }

  return (
    <main ref={mainRef} tabIndex={-1}>
      {renderScreen()}
    </main>
  );
}
