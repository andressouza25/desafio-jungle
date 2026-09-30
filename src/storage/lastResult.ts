import type { MatchResult } from '../game/GameSession';
const STORAGE_KEY = 'pirate-battle:last-result:v1';
export function parseResult(value: unknown): MatchResult | null {
  if (!value || typeof value !== 'object' || !('score' in value) || !('durationSeconds' in value) || !('reason' in value)) return null;
  if (typeof value.score !== 'number' || !Number.isSafeInteger(value.score) || value.score < 0
    || typeof value.durationSeconds !== 'number' || !Number.isFinite(value.durationSeconds)
    || value.durationSeconds <= 0 || value.durationSeconds > 180
    || (value.reason !== 'timeout' && value.reason !== 'player-death')) return null;
  return Object.freeze({ score: value.score, durationSeconds: value.durationSeconds, reason: value.reason });
}
export function loadLastResult(): MatchResult | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseResult(JSON.parse(stored)) : null;
  } catch { return null; }
}
export function saveLastResult(result: MatchResult): boolean {
  if (!parseResult(result)) return false;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); return true; }
  catch { return false; }
}
