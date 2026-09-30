# TASK-09 — Enemies and Spawning

## Objective

Implement Chaser and Shooter enemies, their combat interactions and valid periodic spawning.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — GAME-ENEMY-001–008, GAME-SPAWN-001–005, GAME-PROJECTILE-002–004, GAME-PLAYER-007–008, GAME-COLLISION-001–002, GAME-ARENA-003–004, SIM-001–005 and CONFIG-001
- `ARCHITECTURE.md` — simulation, entities, combat, collision and rendering boundaries
- `DESIGN_SYSTEM.md` — supplied enemy/projectile assets and gameplay visual rules
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`

Use this skill for enemy and projectile rendering integration only. Enemy AI, combat, spawning, health and collision remain simulation-owned.

## Scope

- Implement typed Chaser and Shooter simulation entities with configured health, movement and rotation.
- Implement simple deterministic Chaser pursuit behavior.
- Make Chasers damage the player once on contact and destroy themselves after impact.
- Implement simple deterministic Shooter approach behavior.
- Make Shooters respect configured attack range and cooldown.
- Make Shooters fire simulation-owned enemy projectiles toward the player.
- Apply player-projectile damage to enemies.
- Apply enemy-projectile and Chaser contact damage to the player.
- Ensure damage/collision events resolve at most once per relevant entity/projectile.
- Reuse arena bounds and island collision rules established in TASK-07.
- Spawn both enemy types periodically using simulation time.
- Use the immutable match configuration snapshot for spawn timing and enemy distribution.
- Use seeded randomness for deterministic enemy type and spawn-location selection.
- Validate spawn positions against arena bounds, obstacles and minimum player distance.
- Immediately exclude destroyed enemies and resolved projectiles from further updates, collision and damage.
- Render enemies and enemy projectiles from simulation state using supplied assets.

## Out of Scope

- Final scoring rules.
- HUD.
- Final combat effects.
- Audio.
- Advanced pathfinding.
- Dynamic difficulty.
- Enemy types beyond Chaser and Shooter.
- Hardcoded balance values that belong in `GameConfig`.
- Functionality assigned to TASK-10 or later tasks.

## Acceptance Criteria

- Chaser and Shooter enemies both appear during a standard match.
- Chasers pursue the player, deal configured contact damage once and destroy themselves after impact.
- Shooters approach the player, respect attack range/cooldown and fire damaging projectiles.
- Player projectiles damage enemies exactly once per resolved hit.
- Enemy projectiles damage the player exactly once per resolved hit.
- Enemy AI, cooldowns and spawning use simulation time.
- Spawn selection uses seeded randomness and is deterministic for the same inputs.
- Spawn points avoid obstacles and maintain the required safe distance from the player.
- Enemies respect logical arena and island rules.
- Destroyed enemies cannot update, collide, attack or receive additional damage.
- Pausing the simulation also pauses enemy AI, cooldowns, projectiles and spawning.
- PixiJS only reflects enemy/projectile simulation state.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant enemy, spawning, combat and collision tests.
- Run `build`.
- Use controlled simulation time and deterministic seeds.
- Test Chaser pursuit and contact damage.
- Test Chaser self-destruction after impact.
- Test Shooter movement, attack range and cooldown.
- Test enemy projectile damage and cleanup.
- Test player projectile damage and enemy destruction.
- Test valid spawn locations against arena bounds, islands and player safe distance.
- Test both enemy types appear according to configured distribution.
- Test pause/resume with active enemies, cooldowns, projectiles and spawning.
- Exercise observable player → projectile → enemy damage/destruction and enemy → player damage gameplay flows.
