import type { PendingSubmission } from '../api/SubmissionRecovery';

export function PendingSubmissions({ items, durable, onRetry }: {
  items: readonly PendingSubmission[]; durable: boolean; onRetry: (matchId: string) => void;
}) {
  if (!items.length) return null;
  return <section className="pending-submissions" aria-labelledby="pending-title">
    <h2 id="pending-title">Pending registrations</h2>
    <p>You can keep playing while these battles await confirmation.</p>
    {!durable && <p role="alert">Pending registrations could not be saved on this device. Retry before closing this page.</p>}
    <ul>{items.map(({ record, state }) => <li key={record.matchId}>
      <p>{record.score} points · {new Date(record.date).toISOString()}<small>Match ID: {record.matchId}</small></p>
      <p role="status">{state === 'submitting' ? 'Submitting registration…' : 'Registration pending. Retry when the connection is available.'}</p>
      <button className="log-refresh" type="button" disabled={state === 'submitting'}
        aria-label={`Retry registration for ${record.matchId}`} onClick={() => onRetry(record.matchId)}>Retry Registration</button>
    </li>)}</ul>
  </section>;
}
