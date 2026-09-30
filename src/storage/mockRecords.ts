import { parseMatch, type MatchRecord } from '../api/contracts';
export const MOCK_RECORDS_KEY = 'pirate-battle:mock-records:v1';
export interface RecordStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export function browserRecordStorage(): RecordStorage | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}
export function loadMockRecords(storage?: RecordStorage): MatchRecord[] {
  try {
    const value: unknown = JSON.parse(storage?.getItem(MOCK_RECORDS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    const records = value.map(parseMatch);
    return records.every((record) => record !== null) ? records : [];
  } catch { return []; }
}
