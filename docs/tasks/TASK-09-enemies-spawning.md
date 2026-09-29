# TASK-09 — Enemies and Spawning

## Objective

Implement Chaser and Shooter enemies, their combat interactions and valid periodic spawning.

## References

- `MASTER_SPEC.md`: GAME-ENEMY-001–008, GAME-SPAWN-001–005
- `MASTER_SPEC.md`: GAME-PROJECTILE-002–004, GAME-PLAYER-007–008, GAME-COLLISION-001–002
- `MASTER_SPEC.md`: GAME-ARENA-003–004, SIM-001–005, CONFIG-001

## Skills

- `pixijs`

## Scope

- Implement typed Chaser and Shooter entities with configured health, movement and rotation.
- Make Chasers pursue, damage the player on contact and destroy themselves after impact.
- Make Shooters approach, respect attack range/cooldown and fire damaging enemy projectiles.
- Apply player-projectile damage, enemy-projectile damage and island/boundary blocking.
- Spawn both types periodically using the match snapshot distribution, seeded randomness, safe obstacle-free locations and sufficient player distance.
- Immediately remove destroyed enemies from updates and collisions.

## Out of Scope

- Final score rules, HUD, effects, audio or advanced pathfinding.
- Dynamic difficulty or enemy types beyond Chaser and Shooter.
- Hardcoded balance values in systems.

## Acceptance Criteria

- Both enemy types appear in a standard match and obey their specified behaviors.
- Enemies respect arena/island rules; spawn points avoid obstacles and unavoidable immediate hits.
- Projectiles apply damage once; destroyed entities cannot update, collide or receive further damage.
- Shooter cooldowns and spawning use simulation time and stop with the simulation.

## Validation

- Run `typecheck`, `lint`, enemy/spawn/combat tests and `build`.
- Use deterministic seeds and controlled time to test both AI behaviors and spawn validity.
- Exercise player input → projectile → enemy damage/destruction and enemy attack → player damage as observable gameplay flows.
