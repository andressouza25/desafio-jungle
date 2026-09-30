import { snapshotGameConfig, type GameConfig } from '../game/config/GameConfig';
import type { MatchResult } from '../game/GameSession';
export interface MatchRecord extends MatchResult {
  readonly matchId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly date: string;
  readonly config: GameConfig;
}
export interface Pagination { page: number; pageSize: number }
export interface Page<T> extends Pagination { items: T[]; total: number; totalPages: number }
export interface RankingRequest extends Pagination { config: GameConfig }
export interface HistoryRequest extends Pagination { playerId: string }
export interface RankingEntry extends MatchRecord { rank: number }
export type SubmitMatchRequest = MatchRecord;
// Canonical field order ignores object insertion order and unknown wire fields.
export function configurationKey(config: GameConfig): string {
  const snapshot = snapshotGameConfig(config);
  return JSON.stringify(snapshot, Object.keys(snapshot).sort().concat(
    'durationSeconds', 'health', 'movementSpeed', 'rotationSpeed', 'front', 'leftBroadside', 'rightBroadside',
    'cooldownSeconds', 'speed', 'damage', 'lifetimeSeconds', 'impactDamage', 'attackRange',
    'intervalSeconds', 'minimumPlayerDistance', 'maxPositionAttempts', 'distribution', 'chaser', 'shooter',
  ));
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
// Validate against the complete domain shape before using snapshotGameConfig.
export function isGameConfig(value: unknown): value is GameConfig {
  if (!object(value)) return false;
  const shape: Record<string, string[]> = {
    session: ['durationSeconds'], player: ['health', 'movementSpeed', 'rotationSpeed'],
    projectiles: ['speed', 'damage', 'lifetimeSeconds'], chaser: ['health', 'movementSpeed', 'rotationSpeed', 'impactDamage'],
    shooter: ['health', 'movementSpeed', 'rotationSpeed', 'attackRange', 'cooldownSeconds'],
    spawn: ['intervalSeconds', 'minimumPlayerDistance', 'maxPositionAttempts'],
  };
  for (const [section, fields] of Object.entries(shape)) {
    const part = value[section];
    if (!object(part) || fields.some((field) => typeof part[field] !== 'number')) return false;
  }
  const weapons = value.weapons;
  if (!object(weapons) || !['front', 'leftBroadside', 'rightBroadside'].every((key) => {
    const weapon = weapons[key];
    return object(weapon) && typeof weapon.cooldownSeconds === 'number';
  })) return false;
  const spawn = value.spawn;
  return object(spawn) && object(spawn.distribution)
    && typeof spawn.distribution.chaser === 'number' && typeof spawn.distribution.shooter === 'number';
}
export function parseMatch(value: unknown): MatchRecord | null {
  if (!object(value) || !['matchId', 'playerId', 'playerName', 'date'].every((key) => typeof value[key] === 'string' && value[key].trim().length > 0)
    || typeof value.matchId !== 'string' || typeof value.playerId !== 'string' || typeof value.playerName !== 'string' || typeof value.date !== 'string'
    || !Number.isFinite(Date.parse(value.date)) || typeof value.score !== 'number' || !Number.isSafeInteger(value.score) || value.score < 0
    || typeof value.durationSeconds !== 'number' || !Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0
    || (value.reason !== 'timeout' && value.reason !== 'player-death') || !isGameConfig(value.config)) return null;
  try {
    const config = snapshotGameConfig(value.config);
    if (value.durationSeconds > config.session.durationSeconds) return null;
    return { matchId: value.matchId, playerId: value.playerId, playerName: value.playerName, date: new Date(value.date).toISOString(),
      score: value.score, durationSeconds: value.durationSeconds, reason: value.reason, config };
  } catch { return null; }
}

