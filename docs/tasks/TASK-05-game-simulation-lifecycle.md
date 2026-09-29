# TASK-05 — Game Simulation and Lifecycle

## Objective

Build the deterministic, frame-rate-independent simulation core and complete match lifecycle foundation.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — MATCH-001–008, SIM-001–005, CONFIG-001–005, LIFECYCLE-001–003 and TEST-DETERMINISM-001–004
- `ARCHITECTURE.md` — simulation, rendering and React boundaries
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs` — use only for ticker and rendering-lifecycle integration. Simulation time and game rules must remain independent from PixiJS.

## Scope

- Define typed lifecycle states: `loading`, `ready`, `running`, `paused` and `ended`.
- Implement a game controller with explicit start, pause, resume, end, restart and destroy operations.
- Implement a frame-rate-independent simulation clock using a fixed timestep and accumulator.
- Protect the simulation from excessively large frame deltas.
- Centralize required balance values in typed `GameConfig`.
- Create an immutable configuration snapshot when a match starts.
- Introduce injectable simulation time and seeded randomness interfaces for deterministic tests.
- Publish low-frequency UI snapshots/events without making React part of the simulation update loop.
- Integrate the simulation driver with the existing PixiJS lifecycle without coupling simulation rules to PixiJS.

## Out of Scope

- Concrete player movement.
- Player input behavior.
- Combat, weapons or projectiles.
- Enemies or spawning.
- Collision.
- Final Result screen.
- Match submission.
- Persisting active combat across refresh.
- Rendering objects as simulation state.
- Functionality assigned to TASK-06 or later tasks.

## Acceptance Criteria

- Simulation output is based on elapsed simulation time, not frame count.
- Simulation advances through a fixed timestep independent from rendering frequency.
- Large frame deltas are bounded and cannot cause uncontrolled catch-up.
- Pause stops simulation time.
- Resume cannot apply a hidden-tab or paused-time jump.
- Restart creates clean simulation state and a new immutable configuration snapshot.
- Ending or destroying a match prevents further simulation updates.
- Repeated destroy operations are safe.
- Deterministic time and seeded randomness can be controlled in tests.
- React does not participate in the per-frame simulation loop.
- PixiJS does not own simulation time or game rules.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run lifecycle and simulation unit tests.
- Run `build`.
- Test equivalent elapsed simulation time using different rendering/update step sizes.
- Test start.
- Test pause and resume.
- Test end.
- Test restart.
- Test repeated destroy.
- Test a simulated large frame gap.
- Test deterministic seeded randomness.
- Verify React is not rerendering on every simulation step.
