import type { MatchResult } from '../game/GameSession';
import { ScreenShell } from '../components/ui/ScreenShell';
import { ArtButton } from '../components/ui/ArtButton';
import type { RegistrationState } from '../api/SubmissionRecovery';
import type { ReactNode } from 'react';
export function formatMatchTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds + 1e-9));
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`;
}
export function ResultScreen({ result, saved, registration, pendingRegistrations, onPlayAgain, onBack }: {
  result: MatchResult; saved: boolean; registration?: RegistrationState; onPlayAgain: () => void; onBack: () => void;
  pendingRegistrations?: ReactNode;
}) {
  return <ScreenShell className="menu-panel--result">
    <h1 className="screen-title">Battle Complete</h1>
    <p className="result-score"><span>{result.score}</span> points</p>
    <dl className="result-details">
      <div><dt>Time played</dt><dd>{formatMatchTime(result.durationSeconds)}</dd></div>
      <div><dt>Reason</dt><dd>{result.reason === 'timeout' ? 'Time up' : 'Ship destroyed'}</dd></div>
    </dl>
    <p className="result-status">{saved ? 'Result saved on this device.' : 'Result could not be saved on this device.'}</p>
    {registration && <p className="result-status" role="status">{registration === 'confirmed' ? 'Registration confirmed.'
      : registration === 'submitting' ? 'Submitting registration…' : 'Registration pending. You can retry below or keep playing.'}</p>}
    <div className="result-actions">
      <ArtButton onClick={onPlayAgain}>Play Again</ArtButton>
      <ArtButton variant="secondary" onClick={onBack}>Main Menu</ArtButton>
    </div>
    {pendingRegistrations}
  </ScreenShell>;
}
