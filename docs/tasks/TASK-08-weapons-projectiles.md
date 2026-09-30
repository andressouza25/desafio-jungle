# TASK-08 — Weapons and Projectiles

## Objective

Implement all three player weapons and projectile lifecycle through simulation-time combat systems.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — GAME-WEAPON-001–005, GAME-PROJECTILE-001, GAME-PROJECTILE-004–005, GAME-ARENA-004, SIM-001–005 and CONFIG-001
- `ARCHITECTURE.md` — simulation, combat, collision and rendering boundaries
- `DESIGN_SYSTEM.md` — supplied projectile assets and gameplay visual rules
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`

Use this skill for projectile rendering and PixiJS lifecycle integration only. Weapon rules, cooldowns, projectile state and collision resolution remain simulation-owned.

## Scope

- Consume front, left broadside and right broadside actions from the shared input state established in TASK-06.
- Implement one front projectile fired from the correct ship-relative origin and direction.
- Implement three parallel projectiles for each left/right broadside from correct ship-relative origins and directions.
- Apply independent configured cooldowns for each weapon using simulation time.
- Keep weapon timing and projectile behavior independent from rendering FPS.
- Implement simulation-owned projectile entities with configured speed, damage, lifetime/range and direction.
- Update projectile movement through the fixed-timestep simulation.
- Resolve projectile collisions against islands using the collision foundation from TASK-07.
- Remove projectiles after obstacle collision, expiry/range completion or arena exit.
- Guarantee one-resolution semantics before projectile removal.
- Render projectile entities from simulation state using supplied assets.
- Explicitly create and release owned projectile display objects.

## Out of Scope

- Enemy entities.
- Applying player projectile damage to enemies.
- Enemy projectiles.
- Scoring.
- Polished firing effects.
- Firing audio.
- Balance tuning outside centralized `GameConfig`.
- Functionality assigned to TASK-09 or later tasks.

## Acceptance Criteria

- Front attack creates exactly one correctly oriented projectile.
- Left broadside creates exactly three parallel projectiles.
- Right broadside creates exactly three parallel projectiles.
- Each weapon respects its own configured cooldown.
- Broadside projectiles belong to one weapon activation/cooldown.
- Movement, rotation and attacks work simultaneously.
- Projectile transforms remain simulation truth.
- Projectile motion and cooldown completion are frame-rate independent.
- Projectiles correctly collide with simulation-owned island geometry.
- A projectile can resolve an obstacle collision at most once.
- Removed, expired and out-of-bounds projectiles leave no simulation or PixiJS resources.
- React is not updated per frame for projectile state.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant weapon, projectile and collision tests.
- Run `build`.
- Test front projectile count, origin and direction.
- Test both broadside projectile counts, origins and parallel directions.
- Test independent cooldown boundaries deterministically.
- Test projectile speed and lifetime/range using simulation time.
- Test island collision and one-resolution semantics.
- Test expiry and arena-exit cleanup.
- Exercise real input → weapon system → projectile simulation → collision → rendering behavior.
