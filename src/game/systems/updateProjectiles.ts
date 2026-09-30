import type { EnemyState } from '../entities/Enemy';
import { damageEnemy } from '../entities/Enemy';
import type { PlayerState } from '../entities/Player';
import { PLAYER_COLLIDER_HALF_SIZE } from '../config/arena';
import { ENEMY_COLLIDER_HALF_SIZE } from '../config/enemies';
import type { CollisionArena } from '../config/arena';
import { PROJECTILE_HALF_SIZE } from '../config/weapons';
import type { ProjectileResolution, ProjectileState } from '../entities/Projectile';
import { resolveProjectile } from '../entities/Projectile';
import { containsPoint, expandRectangle, sweepPointAgainstRectangle, sweepPointOutOfRectangle } from './collision';

export function updateProjectiles(projectiles: readonly ProjectileState[], deltaSeconds: number,
  arena: CollisionArena, enemies: readonly EnemyState[] = [], player?: PlayerState): ProjectileState[] {
  const bounds = expandRectangle(arena.bounds, -PROJECTILE_HALF_SIZE);
  return projectiles.filter((projectile) => {
    if (projectile.resolution !== null) return false;
    const travelSeconds = Math.min(deltaSeconds, Math.max(0, projectile.remainingLifetimeSeconds));
    const proposed = { x: projectile.x + projectile.directionX * projectile.speed * travelSeconds,
      y: projectile.y + projectile.directionY * projectile.speed * travelSeconds };
    let fraction = 1;
    let reason: ProjectileResolution | null = projectile.remainingLifetimeSeconds <= deltaSeconds + 1e-9 ? 'expired' : null;
    const exit = sweepPointOutOfRectangle(projectile, proposed, bounds);
    if (exit !== null) { fraction = exit; reason = 'arena-exit'; }
    for (const island of arena.islands) {
      const expanded = expandRectangle(island, PROJECTILE_HALF_SIZE);
      const hit = containsPoint(expanded, projectile) ? 0 : sweepPointAgainstRectangle(projectile, proposed, expanded, true);
      if (hit !== null && hit <= fraction) { fraction = hit; reason = 'island'; }
    }
    let applyDamage: (() => void) | null = null;
    const targets = projectile.weapon === 'enemy' ? (player && player.health > 0 ? [player] : []) : enemies.filter((enemy) => !enemy.destroyed);
    for (const candidate of targets) {
      const halfSize = projectile.weapon === 'enemy' ? PLAYER_COLLIDER_HALF_SIZE : ENEMY_COLLIDER_HALF_SIZE;
      const rectangle = expandRectangle({ x: candidate.x, y: candidate.y, width: 0, height: 0 }, halfSize + PROJECTILE_HALF_SIZE);
      const hit = containsPoint(rectangle, projectile) ? 0 : sweepPointAgainstRectangle(projectile, proposed, rectangle, true);
      // Obstacles win ties; stable entity order breaks equal target contacts.
      if (hit !== null && (hit < fraction || (hit === fraction && reason === null))) {
        fraction = hit; reason = 'target'; applyDamage = () => {
          const enemy = enemies.find((enemy) => enemy === candidate);
          if (enemy) damageEnemy(enemy, projectile.damage, 'player-attack');
          else candidate.health = Math.max(0, candidate.health - projectile.damage);
        };
      }
    }
    if (applyDamage && reason === 'target' && resolveProjectile(projectile, 'target')) applyDamage();
    // Commit only the earliest terminal point. Never advance a resolved projectile again.
    projectile.x += (proposed.x - projectile.x) * fraction;
    projectile.y += (proposed.y - projectile.y) * fraction;
    projectile.remainingLifetimeSeconds = Math.max(0, projectile.remainingLifetimeSeconds - travelSeconds * fraction);
    if (reason) { resolveProjectile(projectile, reason); return false; }
    return true;
  });
}
