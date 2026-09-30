import type { GameConfig } from '../config/GameConfig';
import { PLAYER_COLLIDER_HALF_SIZE } from '../config/arena';
import type { CollisionArena } from '../config/arena';
import { ENEMY_COLLIDER_HALF_SIZE, ENEMY_MUZZLE_DISTANCE } from '../config/enemies';
import type { EnemyState } from '../entities/Enemy';
import type { PlayerState } from '../entities/Player';
import type { ProjectileState } from '../entities/Projectile';
import type { WeaponState } from './fireWeapons';
import { containsPoint, expandRectangle, resolveArenaMovement, sweepPointAgainstRectangle } from './collision';
export function updateEnemies(enemies: readonly EnemyState[], player: PlayerState, config: GameConfig,
  delta: number, seconds: number, weapons: WeaponState, arena: CollisionArena): ProjectileState[] {
  const shots: ProjectileState[] = [];
  for (const enemy of enemies) {
    if (enemy.destroyed || player.health === 0) continue;
    const balance = config[enemy.kind];
    const dx = player.x - enemy.x; const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const difference = ((Math.atan2(dx, -dy) - enemy.rotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    enemy.rotation = (enemy.rotation + Math.max(-balance.rotationSpeed * delta, Math.min(balance.rotationSpeed * delta, difference)) + Math.PI * 2) % (Math.PI * 2);
    const travel = enemy.kind === 'shooter' && distance <= config.shooter.attackRange ? 0 : balance.movementSpeed * delta;
    const proposed = resolveArenaMovement(enemy, { x: enemy.x + Math.sin(enemy.rotation) * travel,
      y: enemy.y - Math.cos(enemy.rotation) * travel }, ENEMY_COLLIDER_HALF_SIZE, arena);
    const contact = expandRectangle({ x: player.x, y: player.y, width: 0, height: 0 }, PLAYER_COLLIDER_HALF_SIZE + ENEMY_COLLIDER_HALF_SIZE);
    const impact = containsPoint(contact, enemy) ? 0 : sweepPointAgainstRectangle(enemy, proposed, contact, true);
    enemy.x = proposed.x; enemy.y = proposed.y;
    if (enemy.kind === 'chaser' && impact !== null) {
      enemy.destroyed = true; enemy.health = 0;
      player.health = Math.max(0, player.health - config.chaser.impactDamage);
    } else if (enemy.kind === 'shooter' && distance <= config.shooter.attackRange && seconds + 1e-9 >= enemy.readyAtSeconds) {
      const directionX = distance === 0 ? 0 : dx / distance;
      const directionY = distance === 0 ? -1 : dy / distance;
      shots.push({ id: weapons.nextProjectileId++, weapon: 'enemy', x: enemy.x + directionX * ENEMY_MUZZLE_DISTANCE,
        y: enemy.y + directionY * ENEMY_MUZZLE_DISTANCE, directionX, directionY, speed: config.projectiles.speed, damage: config.projectiles.damage,
        remainingLifetimeSeconds: config.projectiles.lifetimeSeconds, resolution: null });
      enemy.readyAtSeconds = seconds + config.shooter.cooldownSeconds;
    }
  }
  return shots;
}
