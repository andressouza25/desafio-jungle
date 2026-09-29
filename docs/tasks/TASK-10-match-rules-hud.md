# TASK-10 — Match Rules and HUD

## Objective

Complete match termination, scoring, player health, semantic HUD snapshots and the Result flow.

## References

- `MASTER_SPEC.md`: PRODUCT-003, MATCH-001–008, GAME-SCORE-001–004
- `MASTER_SPEC.md`: GAME-PLAYER-006–008, HUD-001–003, SCREEN-003–004, PERSIST-002
- `DESIGN_SYSTEM.md`: sections 6–7, 15–16 and 23

## Skills

- `pixijs`
- `frontend-design`

## Scope

- Apply configured player health and damage from valid enemy interactions.
- Award exactly one point only when a player attack destroys an enemy.
- Run the configured match timer in simulation time and end on timeout or player death.
- Stop all gameplay mutation when ended and produce typed final result data with score, effective duration and termination reason.
- Feed React with throttled/event-driven HUD data for health, score and remaining time; render PixiJS health indicators above ships.
- Implement the Result screen, Play Again/Main Menu actions and last-result persistence.

## Out of Scope

- Remote match registration or pending recovery.
- Final pause, feedback/audio polish and touch controls.
- Per-frame React state updates.

## Acceptance Criteria

- Player kills award one point once; Chaser collision self-destruction awards none.
- Timeout and zero health each end the match exactly once.
- Movement, attacks, damage, spawning, score and timers stop after end.
- HUD and semantic UI expose accurate health, score, time and match state without frame-level announcements.
- Play Again starts cleanly; Main Menu exits without registering an abandoned match.

## Validation

- Run `typecheck`, `lint`, match/scoring/HUD tests and `build`.
- Deterministically test both termination reasons, duplicate-hit prevention and post-end immutability.
- Exercise a complete start → combat → result → restart flow and verify persisted result data.
