import type { GameConfig, WeaponId } from '../config/GameConfig';
import { WEAPON_LAYOUTS } from '../config/weapons';
import type { PlayerState } from '../entities/Player';
import type { ProjectileState } from '../entities/Projectile';
import type { InputState } from '../input/InputState';

export interface WeaponState {
  readyAtSeconds: Record<WeaponId, number>;
  nextProjectileId: number;
}

export function createWeaponState(): WeaponState {
  return { readyAtSeconds: { front: 0, leftBroadside: 0, rightBroadside: 0 }, nextProjectileId: 1 };
}

export function fireWeapons(player: Readonly<PlayerState>, input: InputState, config: GameConfig,
  state: WeaponState, simulationSeconds: number): ProjectileState[] {
  const spawned: ProjectileState[] = [];
  const forwardX = Math.sin(player.rotation);
  const forwardY = -Math.cos(player.rotation);
  const rightX = Math.cos(player.rotation);
  const rightY = Math.sin(player.rotation);
  for (const weapon of ['front', 'leftBroadside', 'rightBroadside'] as const) {
    const layout = WEAPON_LAYOUTS[weapon];
    // Tolerance handles accumulated floating-point simulation seconds at exact boundaries.
    if (!input.isHeld(layout.action) || simulationSeconds + 1e-9 < state.readyAtSeconds[weapon]) continue;
    const directionX = layout.direction === 'forward' ? forwardX : rightX * (layout.direction === 'left' ? -1 : 1);
    const directionY = layout.direction === 'forward' ? forwardY : rightY * (layout.direction === 'left' ? -1 : 1);
    for (const origin of layout.origins) {
      spawned.push({ id: state.nextProjectileId++, weapon,
        x: player.x + forwardX * origin.forward + rightX * origin.side,
        y: player.y + forwardY * origin.forward + rightY * origin.side,
        directionX, directionY, speed: config.projectiles.speed, damage: config.projectiles.damage,
        remainingLifetimeSeconds: config.projectiles.lifetimeSeconds, resolution: null });
    }
    // One cooldown per activation, not one per broadside projectile. Holding repeats when ready.
    state.readyAtSeconds[weapon] = simulationSeconds + config.weapons[weapon].cooldownSeconds;
  }
  return spawned;
}
