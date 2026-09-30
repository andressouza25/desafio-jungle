import type { CollisionArena, WorldPoint, WorldRectangle } from '../config/arena';

export function expandRectangle(rectangle: WorldRectangle, margin: number): WorldRectangle {
  return { x: rectangle.x - margin, y: rectangle.y - margin,
    width: rectangle.width + margin * 2, height: rectangle.height + margin * 2 };
}

// Touching is allowed; only penetration of the interior blocks movement.
export function containsPoint(rectangle: WorldRectangle, point: WorldPoint): boolean {
  return point.x > rectangle.x && point.x < rectangle.x + rectangle.width
    && point.y > rectangle.y && point.y < rectangle.y + rectangle.height;
}

// Slab intersection over the complete proposed segment, not just its endpoint.
// Returns entry fraction or null; tangent travel and movement away from contact are free.
export function sweepPointAgainstRectangle(from: WorldPoint, to: WorldPoint, rectangle: WorldRectangle): number | null {
  let entry = -Infinity;
  let exit = Infinity;
  for (const axis of ['x', 'y'] as const) {
    const low = rectangle[axis];
    const high = low + (axis === 'x' ? rectangle.width : rectangle.height);
    const delta = to[axis] - from[axis];
    if (delta === 0) {
      if (from[axis] <= low || from[axis] >= high) return null;
      continue;
    }
    const first = (low - from[axis]) / delta;
    const second = (high - from[axis]) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
  }
  if (exit <= 0 || entry >= 1 || entry >= exit) return null;
  return Math.max(0, entry);
}

// Precondition: the starting body is inside the arena and outside all islands.
// A square body reduces to a point against expanded islands and inset bounds.
export function resolveArenaMovement(from: WorldPoint, proposed: WorldPoint, halfSize: number, arena: CollisionArena): WorldPoint {
  const dx = proposed.x - from.x;
  const dy = proposed.y - from.y;
  const minX = arena.bounds.x + halfSize;
  const minY = arena.bounds.y + halfSize;
  const maxX = arena.bounds.x + arena.bounds.width - halfSize;
  const maxY = arena.bounds.y + arena.bounds.height - halfSize;
  let fraction = 1;
  if (dx > 0) fraction = Math.min(fraction, (maxX - from.x) / dx);
  if (dx < 0) fraction = Math.min(fraction, (minX - from.x) / dx);
  if (dy > 0) fraction = Math.min(fraction, (maxY - from.y) / dy);
  if (dy < 0) fraction = Math.min(fraction, (minY - from.y) / dy);
  const distance = Math.hypot(dx, dy);
  for (const island of arena.islands) {
    const hit = sweepPointAgainstRectangle(from, proposed, expandRectangle(island, halfSize));
    if (hit !== null) {
      // A sub-pixel numerical separation avoids roundoff trapping subsequent turns.
      const safeHit = distance === 0 ? 0 : Math.max(0, hit - 1e-7 / distance);
      fraction = Math.min(fraction, safeHit);
    }
  }
  if (fraction === 1) return proposed;
  return { x: Math.min(maxX, Math.max(minX, from.x + dx * fraction)),
    y: Math.min(maxY, Math.max(minY, from.y + dy * fraction)) };
}
