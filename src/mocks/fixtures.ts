import { DEFAULT_GAME_CONFIG } from '../game/config/GameConfig';
import type { MatchRecord } from '../api/contracts';
export function createFixtures(): MatchRecord[] {
  return Array.from({ length: 24 }, (_, index) => ({
    matchId: `fixture-${String(index).padStart(2, '0')}`, playerId: `captain-${index % 6}`, playerName: `Captain ${index % 6 + 1}`,
    date: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(), score: 20 - Math.floor(index / 2),
    durationSeconds: 120, reason: 'timeout', config: DEFAULT_GAME_CONFIG,
  }));
}
