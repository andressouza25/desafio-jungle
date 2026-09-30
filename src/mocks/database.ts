import { configurationKey, type MatchRecord } from '../api/contracts';
import { loadMockRecords, MOCK_RECORDS_KEY, type RecordStorage } from '../storage/mockRecords';
import { createFixtures } from './fixtures';
export class MockDatabase {
  generation = 0;
  private confirmed: MatchRecord[];
  constructor(private storage?: RecordStorage) { this.confirmed = loadMockRecords(storage); }
  records(empty = false): MatchRecord[] { return [...(empty ? [] : createFixtures()), ...this.confirmed]; }
  register(record: MatchRecord): { record: MatchRecord; created: boolean } {
    const existing = this.records().find((item) => item.matchId === record.matchId);
    if (existing) {
      if (existing.playerId !== record.playerId) throw new Error('Match ID belongs to another player.');
      return { record: existing, created: false };
    }
    const next = [...this.confirmed, record];
    // Failed durable writes must not be acknowledged as confirmed.
    this.storage?.setItem(MOCK_RECORDS_KEY, JSON.stringify(next));
    this.confirmed = next;
    return { record, created: true };
  }
  reset() { this.generation++; this.storage?.removeItem(MOCK_RECORDS_KEY); this.confirmed = []; }
}
export function compareRanking(a: MatchRecord, b: MatchRecord): number {
  return b.score - a.score || a.date.localeCompare(b.date) || a.matchId.localeCompare(b.matchId);
}
export function equivalent(a: MatchRecord, context: string) { return configurationKey(a.config) === context; }

