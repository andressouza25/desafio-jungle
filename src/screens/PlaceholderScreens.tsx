import type { Screen } from '../app/navigation';

export function MainMenuScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <>
      <h1>Pirate Battle</h1>
      <p>Main Menu placeholder.</p>
      <nav aria-label="Main menu">
        <button type="button" onClick={() => onNavigate('game')}>Play</button>{' '}
        <button type="button" onClick={() => onNavigate('options')}>Options</button>{' '}
        <button type="button" onClick={() => onNavigate('ranking')}>Ranking</button>{' '}
        <button type="button" onClick={() => onNavigate('match-history')}>Match History</button>
      </nav>
    </>
  );
}

interface PlaceholderScreenProps {
  title: 'Options' | 'Ranking' | 'Match History';
  onBack: () => void;
}

export function PlaceholderScreen({ title, onBack }: PlaceholderScreenProps) {
  return (
    <>
      <h1>{title}</h1>
      <p>{title} screen placeholder.</p>
      <button type="button" onClick={onBack}>Main Menu</button>
    </>
  );
}

interface ResultScreenProps {
  onPlayAgain: () => void;
  onBack: () => void;
}

export function ResultScreen({ onPlayAgain, onBack }: ResultScreenProps) {
  return (
    <>
      <h1>Result</h1>
      <p>Result screen placeholder. No match summary is available.</p>
      <button type="button" onClick={onPlayAgain}>Play Again</button>{' '}
      <button type="button" onClick={onBack}>Main Menu</button>
    </>
  );
}
