export interface WorldPoint { readonly x: number; readonly y: number }
export interface WorldRectangle extends WorldPoint { readonly width: number; readonly height: number }
export interface CollisionArena {
  readonly bounds: WorldRectangle;
  readonly islands: readonly WorldRectangle[];
}

// Domain geometry: viewport changes only affect the renderer's world transform.
export const LOGICAL_ARENA = Object.freeze({ width: 1280, height: 720 });

export const ARENA_LAYOUT: CollisionArena = Object.freeze({
  bounds: Object.freeze({ x: 0, y: 0, ...LOGICAL_ARENA }),
  islands: Object.freeze([Object.freeze({ x: 256, y: 224, width: 192, height: 192 })]),
});

// Conservative, rotation-independent square: ceil(hypot(66 / 2, 113 / 2)).
// Encloses the supplied ship artwork at every heading, without reading sprite bounds.
export const PLAYER_COLLIDER_HALF_SIZE = 66;
