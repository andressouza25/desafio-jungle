import type { GameConfig } from '../config/GameConfig';
import type { WorldPoint } from '../config/arena';
export type EnemyKind = 'chaser' | 'shooter';
export interface EnemyState {
  readonly id: number;
  readonly kind: EnemyKind;
  x: number; y: number; rotation: number; health: number;
  readyAtSeconds: number; destroyed: boolean;
  destructionSource: 'player-attack' | 'contact' | 'other' | null;
}
export function createEnemy(id: number, kind: EnemyKind, position: WorldPoint, config: GameConfig): EnemyState {
  return { id, kind, ...position, rotation: 0, health: config[kind].health, readyAtSeconds: 0, destroyed: false, destructionSource: null };
}
export function damageEnemy(enemy: EnemyState, damage: number, source: NonNullable<EnemyState['destructionSource']> = 'other'): boolean {
  if (enemy.destroyed) return false;
  enemy.health = Math.max(0, enemy.health - damage);
  if (enemy.health === 0) { enemy.destroyed = true; enemy.destructionSource = source; }
  return true;
}
