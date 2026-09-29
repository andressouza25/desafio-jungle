import { DEFAULT_OPTIONS, OPTION_LIMITS } from '../game/config/GameConfig';
import type { GameOptions } from '../game/config/GameConfig';
export { DEFAULT_OPTIONS, OPTION_LIMITS } from '../game/config/GameConfig';
export type { GameOptions } from '../game/config/GameConfig';

const STORAGE_KEY = 'pirate-battle:options:v1';

function isWithinLimits(value: unknown, limits: { min: number; max: number }): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= limits.min
    && value <= limits.max;
}

function isGameOptions(value: unknown): value is GameOptions {
  if (typeof value !== 'object' || value === null) return false;
  if (!('sessionDurationSeconds' in value) || !('enemySpawnIntervalSeconds' in value)) return false;
  return isWithinLimits(value.sessionDurationSeconds, OPTION_LIMITS.sessionDurationSeconds)
    && isWithinLimits(value.enemySpawnIntervalSeconds, OPTION_LIMITS.enemySpawnIntervalSeconds);
}

export function parseOptionValue(value: string, limits: { min: number; max: number }): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return isWithinLimits(parsed, limits) ? parsed : null;
}

// Read afresh when creating a future match snapshot; never share a mutable options object.
export function loadOptions(): GameOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isGameOptions(parsed)) {
        return {
          sessionDurationSeconds: parsed.sessionDurationSeconds,
          enemySpawnIntervalSeconds: parsed.enemySpawnIntervalSeconds,
        };
      }
    }
  } catch {
    // Storage may be unavailable or contain stale data; defaults remain usable.
  }
  return { ...DEFAULT_OPTIONS };
}

export function saveOptions(options: GameOptions): boolean {
  if (!isGameOptions(options)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    return true;
  } catch {
    return false;
  }
}
