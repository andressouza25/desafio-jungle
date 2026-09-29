# TASK-06 — Player and Input

## Objective

Implement the player entity and shared action-based input for frame-rate-independent keyboard control.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — GAME-PLAYER-001–003, GAME-PLAYER-006, GAME-PLAYER-009, INPUT-001, INPUT-003–005 and SIM-001–005
- `ARCHITECTURE.md` — simulation, input, rendering and React boundaries
- `DESIGN_SYSTEM.md` — supplied player ship assets and gameplay visual rules
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`

Use this skill for player rendering and PixiJS lifecycle integration only. Player state and input rules remain independent from PixiJS.

## Scope

- Define typed gameplay actions for movement, rotation, three attacks and pause.
- Implement an action-based input state store consumed by simulation systems.
- Map documented keyboard controls to gameplay actions only while gameplay is active.
- Keep browser event handlers limited to translating physical input into actions.
- Implement player simulation state including position, rotation and initial health.
- Implement player PixiJS rendering using supplied ship assets.
- Synchronize the rendered player transform from simulation state.
- Apply configured forward speed and rotation speed using simulation delta time.
- Support simultaneous compatible actions.
- Clear active input state on pause, end, focus loss and game destruction.
- Remove all owned input listeners during teardown.

## Out of Scope

- Touch bindings.
- Firing/projectile behavior for attack actions.
- Arena or island collision.
- Damage behavior.
- HUD.
- Ship deterioration effects.
- Gameplay rules inside browser event handlers.
- React state updates for continuous player transforms.
- Functionality assigned to TASK-07 or later tasks.

## Acceptance Criteria

- The player moves forward and rotates left/right.
- Compatible actions can be held simultaneously.
- Equal simulation time produces equivalent player motion at different rendering frame rates.
- Physical keyboard input is translated into gameplay actions before reaching simulation logic.
- Keyboard events outside active gameplay do not affect gameplay input or normal page usability.
- Attack actions exist in the input model but do not fire weapons yet.
- Player position and rotation remain simulation truth.
- PixiJS only reflects simulation state.
- React is not updated per frame with player transforms.
- Input cannot remain stuck after pause, blur, end or teardown.
- Remounting gameplay does not create duplicate keyboard listeners.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant input and simulation tests.
- Run `build`.
- Exercise keyboard input through the simulation and verify observable player movement and rotation.
- Test simultaneous movement and rotation.
- Test equivalent motion using different rendering/update frequencies.
- Test pause and resume while keys are held.
- Test focus loss while keys are held.
- Test match end while keys are held.
- Mount, destroy and remount gameplay and verify there are no duplicate listeners or actions.
