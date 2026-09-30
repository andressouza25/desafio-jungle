import type { GameConfig } from '../config/GameConfig';
import type { CollisionArena, WorldPoint } from '../config/arena';
import { ENEMY_COLLIDER_HALF_SIZE } from '../config/enemies';
import type { RandomSource } from '../core/random';
import { createEnemy } from '../entities/Enemy';
import type { EnemyState } from '../entities/Enemy';
import { containsPoint, expandRectangle } from './collision';
export interface SpawnState { nextAtSeconds: number; nextEnemyId: number }
export function validSpawn(position: WorldPoint, player: WorldPoint, config: GameConfig, arena: CollisionArena): boolean {
  const bounds = expandRectangle(arena.bounds, -ENEMY_COLLIDER_HALF_SIZE);
  return position.x >= bounds.x && position.x <= bounds.x + bounds.width
    && position.y >= bounds.y && position.y <= bounds.y + bounds.height
    && Math.hypot(position.x - player.x, position.y - player.y) >= config.spawn.minimumPlayerDistance
    && !arena.islands.some((island) => containsPoint(expandRectangle(island, ENEMY_COLLIDER_HALF_SIZE), position));
}
export function spawnEnemies(state: SpawnState, seconds: number, player: WorldPoint,
  config: GameConfig, random: RandomSource, arena: CollisionArena): EnemyState[] {
  if (seconds + 1e-9 < state.nextAtSeconds) return [];
  // Failed selection skips this interval; no retry debt or unbounded loop.
  state.nextAtSeconds += config.spawn.intervalSeconds;
  const kind = random.next() < config.spawn.distribution.chaser ? 'chaser' : 'shooter';
  const bounds = expandRectangle(arena.bounds, -ENEMY_COLLIDER_HALF_SIZE);
  for (let attempt = 0; attempt < config.spawn.maxPositionAttempts; attempt += 1) {
    const position = { x: bounds.x + random.next() * bounds.width, y: bounds.y + random.next() * bounds.height };
    if (validSpawn(position, player, config, arena)) return [createEnemy(state.nextEnemyId++, kind, position, config)];
  }
  return [];
}
