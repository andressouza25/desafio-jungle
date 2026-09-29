# TASK-06 — Player and Input

## Objective

Implement the player entity and shared action-based input for frame-rate-independent keyboard control.

## References

- `MASTER_SPEC.md`: GAME-PLAYER-001–003, GAME-PLAYER-006, GAME-PLAYER-009
- `MASTER_SPEC.md`: INPUT-001, INPUT-003–005, SIM-001–005
- `AGENTS.md`: sections 6–11 and 15–16

## Skills

- `pixijs`

## Scope

- Define typed gameplay actions for movement, rotation, three attacks and pause.
- Implement an input state store consumed by simulation systems.
- Map documented keyboard controls to actions only while gameplay is active.
- Implement player position, rotation, health initialization and PixiJS rendering.
- Apply configured forward speed and rotation speed using simulation delta time.
- Clear state on pause, end, focus loss and game destruction; remove all listeners.

## Out of Scope

- Touch bindings, firing behavior, arena/island collision and damage.
- HUD or ship deterioration effects.
- Gameplay logic inside browser event handlers.

## Acceptance Criteria

- The player moves forward and rotates left/right, including simultaneous actions.
- Equal simulation time produces equivalent motion at different frame rates.
- Keyboard events outside active gameplay do not affect input or page usability.
- Player transform remains simulation truth; React is not updated per frame.
- Input cannot remain stuck after pause, blur, end or teardown.

## Validation

- Run `typecheck`, `lint`, input/simulation tests and `build`.
- Exercise keyboard input through simulation to observable player movement and rotation.
- Remount gameplay and verify there are no duplicate listeners or actions.
