import { parseMatch, type MatchRecord } from '../api/contracts';
import type { RecordStorage } from './mockRecords';

export const PENDING_SUBMISSIONS_KEY = 'pirate-battle:pending-submissions:v1';

export function loadPendingSubmissions(storage?: RecordStorage): MatchRecord[] {
  try {
    const value: unknown = JSON.parse(storage?.getItem(PENDING_SUBMISSIONS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    const unique = new Map<string, MatchRecord>();
    for (const item of value) {
      const record = parseMatch(item);
      if (record && !unique.has(record.matchId)) unique.set(record.matchId, record);
    }
    return [...unique.values()];
  } catch { return []; }
}

export function savePendingSubmissions(records: readonly MatchRecord[], storage?: RecordStorage): boolean {
  try {
    if (!storage) return false;
    storage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(records));
    return true;
  } catch { return false; }
}
