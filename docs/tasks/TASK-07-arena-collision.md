# TASK-07 — Arena and Collision

## Objective

Create the playable water arena, solid islands and reusable simulation-owned collision rules.

## References

- `MASTER_SPEC.md`: GAME-PLAYER-004–005, GAME-ARENA-001–004, GAME-COLLISION-001–002
- `MASTER_SPEC.md`: RESPONSIVE-005–007, SIM-001–003
- `DESIGN_SYSTEM.md`: sections 2–6, 14–17 and 31–33
- Supplied environment tiles, island assets and gameplay references

## Skills

- `pixijs` — use for scene, coordinate and rendering integration; collision truth remains in the simulation.

## Scope

- Compose water and at least one island with supplied assets.
- Define logical arena bounds and obstacle collision shapes outside rendering objects.
- Prevent the player from leaving bounds or crossing islands, including high-delta/tunneling edge cases appropriate to configured speed.
- Add reusable collision queries for future ships and projectiles.
- Keep logical arena rules stable while presentation scales to the viewport.

## Out of Scope

- Enemy behavior, projectile hits, damage or scoring.
- Complex physics engines or pathfinding.
- Responsive touch controls.

## Acceptance Criteria

- The player remains inside the visible logical arena.
- Islands consistently block the player from every approach direction.
- Collision resolution is deterministic and independent of PixiJS display objects.
- Viewport resizing does not change world rules or invalidate coordinates.

## Validation

- Run `typecheck`, `lint`, collision tests and `build`.
- Test all arena edges, island approaches and a large allowed simulation step.
- Verify input → simulation → collision → visible position in a gameplay test.
