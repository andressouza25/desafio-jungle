import type { WeaponId } from '../config/GameConfig';

export type ProjectileResolution = 'island' | 'expired' | 'arena-exit' | 'cleared';

export interface ProjectileState {
  readonly id: number;
  readonly weapon: WeaponId;
  x: number;
  y: number;
  readonly directionX: number;
  readonly directionY: number;
  readonly speed: number;
  readonly damage: number;
  remainingLifetimeSeconds: number;
  resolution: ProjectileResolution | null;
}

// Terminal gate: retained references cannot resolve twice or re-enter updates.
export function resolveProjectile(projectile: ProjectileState, reason: ProjectileResolution): boolean {
  if (projectile.resolution !== null) return false;
  projectile.resolution = reason;
  return true;
}
