import type { QueryClient } from '@tanstack/react-query';
import { parseMatch, type MatchRecord } from './contracts';
import { submissionMutation } from './queryClient';
import { loadPendingSubmissions, savePendingSubmissions } from '../storage/pendingSubmissions';
import type { RecordStorage } from '../storage/mockRecords';

export type RegistrationState = 'submitting' | 'pending' | 'confirmed';
export interface PendingSubmission { readonly record: MatchRecord; readonly state: RegistrationState }

// One app-lifetime owner survives screen changes. The query mutation owns remote state.
export class SubmissionRecovery {
  private records: MatchRecord[];
  private readonly states = new Map<string, RegistrationState>();
  private readonly active = new Map<string, Promise<void>>();
  private readonly listeners = new Set<() => void>();
  private snapshot: readonly PendingSubmission[] = [];
  private durable = true;

  constructor(private readonly client: QueryClient, private readonly storage?: RecordStorage) {
    this.records = loadPendingSubmissions(storage);
    for (const record of this.records) this.states.set(record.matchId, 'pending');
    this.publish();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getSnapshot = () => this.snapshot;
  isDurable = () => this.durable;
  state(matchId: string): RegistrationState { return this.states.get(matchId) ?? 'confirmed'; }

  enqueue(value: MatchRecord): void {
    const record = parseMatch(value);
    if (!record) throw new Error('Only valid completed matches can be queued.');
    if (this.states.has(record.matchId)) return;
    this.records = [...this.records, record];
    this.states.set(record.matchId, 'pending');
    this.persist(); this.publish();
  }

  retry(matchId: string): Promise<void> {
    const running = this.active.get(matchId);
    if (running) return running;
    const record = this.records.find((item) => item.matchId === matchId);
    if (!record) return Promise.resolve();
    this.states.set(matchId, 'submitting');
    // Schedule after registering the promise so synchronous observers cannot start a duplicate.
    const attempt = Promise.resolve().then(async () => {
      try {
        const confirmed = await this.client.getMutationCache().build(this.client, submissionMutation(this.client)).execute(record);
        if (!parseMatch(confirmed) || confirmed.matchId !== matchId || confirmed.playerId !== record.playerId)
          throw new Error('Registration was not confirmed for this match.');
        this.records = this.records.filter((item) => item.matchId !== matchId);
        this.states.set(matchId, 'confirmed');
      } catch {
        this.states.set(matchId, 'pending');
      } finally {
        this.active.delete(matchId);
        this.persist(); this.publish();
      }
    });
    this.active.set(matchId, attempt); this.publish();
    return attempt;
  }

  private persist() { this.durable = savePendingSubmissions(this.records, this.storage); }
  private publish() {
    this.snapshot = this.records.map((record) => ({ record, state: this.state(record.matchId) }));
    for (const listener of this.listeners) listener();
  }
}
