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
