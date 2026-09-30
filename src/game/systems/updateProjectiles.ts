import type { CollisionArena } from '../config/arena';
import { PROJECTILE_HALF_SIZE } from '../config/weapons';
import type { ProjectileResolution, ProjectileState } from '../entities/Projectile';
import { resolveProjectile } from '../entities/Projectile';
import { containsPoint, expandRectangle, sweepPointAgainstRectangle, sweepPointOutOfRectangle } from './collision';

export function updateProjectiles(projectiles: readonly ProjectileState[], deltaSeconds: number,
  arena: CollisionArena): ProjectileState[] {
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
    // Commit only the earliest terminal point. Never advance a resolved projectile again.
    projectile.x += (proposed.x - projectile.x) * fraction;
    projectile.y += (proposed.y - projectile.y) * fraction;
    projectile.remainingLifetimeSeconds = Math.max(0, projectile.remainingLifetimeSeconds - travelSeconds * fraction);
    if (reason) { resolveProjectile(projectile, reason); return false; }
    return true;
  });
}
