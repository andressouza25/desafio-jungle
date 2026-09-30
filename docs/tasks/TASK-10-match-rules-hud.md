# TASK-10 — Match Rules and HUD

## Objective

Complete match termination, scoring, player health, semantic HUD snapshots and the Result flow.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — PRODUCT-003, MATCH-001–008, GAME-SCORE-001–004, GAME-PLAYER-006–008, HUD-001–003, SCREEN-003–004 and PERSIST-002
- `ARCHITECTURE.md` — simulation, UI snapshot, lifecycle and persistence boundaries
- `DESIGN_SYSTEM.md` — HUD, health indicator and Result visual rules
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`
- `frontend-design`

Use `pixijs` for gameplay health indicators and rendering integration.

Use `frontend-design` for the semantic HUD and Result screen.

Supplied assets, references and `DESIGN_SYSTEM.md` remain the visual source of truth.

## Scope

- Apply configured player health and damage from valid enemy interactions.
- Track enough combat attribution to determine whether an enemy was destroyed by a player attack.
- Award exactly one point only when a player attack destroys an enemy.
- Do not award points for Chaser self-destruction or other non-player destruction.
- Run the configured match timer using simulation time.
- End the match when time expires or player health reaches zero.
- Ensure match termination resolves exactly once.
- Stop gameplay mutation after the match reaches `ended`.
- Produce typed immutable final result data containing score, effective duration and termination reason.
- Publish throttled/event-driven semantic HUD data for player health, score, remaining time and match state.
- Render PixiJS health indicators above relevant ships.
- Implement the Result screen using the established visual system.
- Implement Play Again and Main Menu actions.
- Persist the last completed result locally.
- Ensure Play Again creates a completely clean match.

## Out of Scope

- Remote match registration.
- Pending submission/recovery.
- Final pause behavior.
- Final combat feedback/effects.
- Audio polish.
- Touch controls.
- Per-frame React state updates.
- Ranking or Match History integration.
- Functionality assigned to TASK-11 or later tasks.

## Acceptance Criteria

- Player-caused enemy destruction awards exactly one point.
- Chaser contact self-destruction awards no point.
- Duplicate damage/destruction resolution cannot award duplicate score.
- Timeout ends the match exactly once.
- Zero player health ends the match exactly once.
- Match termination produces one immutable final result.
- Movement, attacks, damage, spawning, score and simulation timer mutation stop after end.
- HUD exposes accurate health, score, remaining time and match state without per-frame React updates.
- PixiJS health indicators reflect simulation health without becoming health truth.
- Result displays the completed match data.
- Last completed result survives refresh.
- Play Again starts a clean match.
- Main Menu exits the Result flow without creating or registering another match.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant match, scoring, HUD and persistence tests.
- Run `build`.
- Deterministically test timeout termination.
- Deterministically test player-death termination.
- Test player-caused kill scoring.
- Test Chaser self-destruction produces no score.
- Test duplicate-hit/destruction prevention.
- Test post-end simulation immutability.
- Test HUD snapshot/update behavior.
- Test last-result persistence and reload.
- Exercise complete start → combat → result → Play Again flow.
- Exercise complete start → combat → result → Main Menu flow.
