# TASK-05 — Game Simulation and Lifecycle

## Objective

Build the deterministic, frame-rate-independent simulation core and complete match lifecycle foundation.

## References

- `MASTER_SPEC.md`: MATCH-001–008, SIM-001–005, CONFIG-001–005, LIFECYCLE-001–003
- `MASTER_SPEC.md`: TEST-DETERMINISM-001–004
- `AGENTS.md`: sections 6, 8–10 and 15

## Skills

- `pixijs` — use for ticker and rendering-lifecycle integration only; simulation time and rules remain independent from PixiJS.

## Scope

- Define typed lifecycle states: `loading`, `ready`, `running`, `paused` and `ended`.
- Implement a game controller, simulation clock with large-delta protection, and explicit start, pause, resume, end and destroy operations.
- Centralize all required balance values in typed `GameConfig` and snapshot settings when a match starts.
- Introduce injectable simulation time and seeded randomness interfaces for deterministic tests.
- Publish low-frequency UI snapshots/events without making React part of the update loop.

## Out of Scope

- Concrete player movement, combat, enemies, collisions or spawning.
- Final Result screen and match submission.
- Persisting active combat across refresh.

## Acceptance Criteria

- Simulation output is based on elapsed simulation time, not frame count.
- Pause stops simulation time; resume cannot apply a hidden-tab time jump.
- Restart creates a clean state and immutable configuration snapshot.
- Ending or destroying a match prevents further updates and releases owned resources.
- Deterministic time and randomness can be controlled in tests.

## Validation

- Run `typecheck`, `lint`, lifecycle unit tests and `build`.
- Test equivalent elapsed time with different update step sizes.
- Test start, pause/resume, end, restart and repeated destroy, including a simulated large frame gap.
