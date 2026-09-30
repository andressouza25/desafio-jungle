# TASK-07 — Arena and Collision

## Objective

Create the playable water arena, solid islands and reusable simulation-owned collision rules.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — GAME-PLAYER-004–005, GAME-ARENA-001–004, GAME-COLLISION-001–002, RESPONSIVE-005–007 and SIM-001–003
- `ARCHITECTURE.md` — simulation, rendering and world-coordinate boundaries
- `DESIGN_SYSTEM.md` — environment assets and gameplay visual rules
- Supplied environment tiles, island assets and gameplay references
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`

Use this skill for scene composition, coordinate systems and rendering integration. Collision state and collision rules remain owned by the simulation.

## Scope

- Extend the player movement pipeline established in TASK-06 with arena collision resolution.
- Compose the water arena and at least one island using supplied assets.
- Define logical arena bounds independently from viewport dimensions.
- Define obstacle collision shapes as simulation data rather than PixiJS display objects.
- Prevent the player from leaving arena bounds.
- Prevent the player from crossing islands from any approach direction.
- Handle high-delta/tunneling cases appropriate to the configured player speed and simulation timestep without introducing a general-purpose physics engine.
- Add reusable simulation-level collision queries for future ships and projectiles.
- Keep logical arena coordinates and rules stable while rendering scales to the viewport.

## Out of Scope

- Enemy behavior.
- Projectile collision or projectile hits.
- Damage.
- Scoring.
- Pathfinding.
- General-purpose or complex physics engines.
- Touch controls.
- Final arena polish or combat effects.
- Functionality assigned to TASK-08 or later tasks.

## Acceptance Criteria

- The player remains completely inside the logical arena.
- Islands consistently block the player from every relevant approach direction.
- Player movement flows through simulation collision resolution before being rendered.
- Collision geometry is simulation-owned and independent from PixiJS display objects.
- Collision resolution is deterministic.
- Collision queries are reusable by future gameplay systems without depending on rendering objects.
- Viewport resizing does not change world rules or logical coordinates.
- Existing TASK-06 input and movement behavior remains intact when no collision occurs.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant collision and simulation tests.
- Run `build`.
- Test every arena boundary.
- Test island collision from multiple approach directions.
- Test collision while moving and rotating simultaneously.
- Test a large allowed simulation step for tunneling/regression cases.
- Verify `input → simulation → collision → rendered position`.
- Resize the viewport and verify logical collision behavior remains unchanged.
