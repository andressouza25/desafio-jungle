# TASK-08 — Weapons and Projectiles

## Objective

Implement all three player weapons and projectile lifecycle through simulation-time combat systems.

## References

- `MASTER_SPEC.md`: GAME-WEAPON-001–005, GAME-PROJECTILE-001 and GAME-PROJECTILE-004–005
- `MASTER_SPEC.md`: GAME-ARENA-004, SIM-001–005, CONFIG-001
- `AGENTS.md`: sections 8, 10 and 15–16

## Skills

- `pixijs`

## Scope

- Consume front, left broadside and right broadside actions from the shared input state.
- Fire one forward projectile or three parallel side projectiles from correct ship-relative origins and directions.
- Apply independent configured weapon cooldowns using simulation time.
- Update configured projectile speed, damage and lifetime/range.
- Remove projectiles on island hit, expiry or arena exit, with one-resolution collision semantics.
- Render and release projectile display objects with clear ownership.

## Out of Scope

- Enemy entities and damage application to them.
- Enemy projectiles, scoring and polished firing effects/audio.
- Balance tuning outside centralized configuration.

## Acceptance Criteria

- Each attack produces the specified projectile pattern and respects its own cooldown.
- Movement, rotation and attacks work simultaneously.
- Projectile motion and cooldown completion are frame-rate independent.
- A projectile resolves an obstacle hit at most once and is then removed.
- Expired and out-of-bounds projectiles leave no simulation or rendering resources.

## Validation

- Run `typecheck`, `lint`, weapon/projectile tests and `build`.
- Test projectile count, origins, directions, cooldown boundaries and cleanup deterministically.
- Exercise real input → simulation → rendered projectile behavior in gameplay.
