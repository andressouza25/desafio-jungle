interface PlaceholderScreenProps {
  title: 'Ranking' | 'Match History';
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
