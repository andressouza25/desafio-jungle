# Pirate Battle — Implementation Roadmap

Implement one task at a time, in order. Before each task, follow `AGENTS.md`, read the task file and re-check the referenced requirements. A checked item means its acceptance criteria were verified, not merely coded.

## Roadmap

- [x] [TASK-00 — Project Analysis](./tasks/TASK-00-project-analysis.md)
- [x] [TASK-01 — Project Bootstrap](./tasks/TASK-01-project-bootstrap.md)
- [x] [TASK-02 — Application Foundation](./tasks/TASK-02-application-foundation.md)
- [x] [TASK-03 — UI Foundation](./tasks/TASK-03-ui-foundation.md)
- [x] [TASK-04 — PixiJS and Asset Foundation](./tasks/TASK-04-pixi-asset-foundation.md)
- [x] [TASK-05 — Game Simulation and Lifecycle](./tasks/TASK-05-game-simulation-lifecycle.md)
- [x] [TASK-06 — Player and Input](./tasks/TASK-06-player-input.md)
- [x] [TASK-07 — Arena and Collision](./tasks/TASK-07-arena-collision.md)
- [x] [TASK-08 — Weapons and Projectiles](./tasks/TASK-08-weapons-projectiles.md)
- [x] [TASK-09 — Enemies and Spawning](./tasks/TASK-09-enemies-spawning.md)
- [x] [TASK-10 — Match Rules and HUD](./tasks/TASK-10-match-rules-hud.md)
- [x] [TASK-11 — Pause, Feedback and Audio](./tasks/TASK-11-pause-feedback-audio.md)
- [x] [TASK-12 — Mobile and Responsive Gameplay](./tasks/TASK-12-mobile-responsive.md)
- [x] [TASK-13 — API, MSW and Remote Data](./tasks/TASK-13-api-msw-data.md)
- [x] [TASK-14 — Ranking and Match History](./tasks/TASK-14-ranking-history.md)
- [x] [TASK-15 — Match Submission and Recovery](./tasks/TASK-15-submission-recovery.md)
- [x] [TASK-16 — E2E and Visual Tests](./tasks/TASK-16-e2e-visual-tests.md)
- [x] [TASK-17 — Performance and Accessibility](./tasks/TASK-17-performance-accessibility.md)
- [x] [TASK-18 — Documentation and Deployment](./tasks/TASK-18-documentation-deployment.md)
- [x] [TASK-19 — Final Audit](./tasks/TASK-19-final-audit.md)

TASK-19 verified the implemented TASK-09/10/11 acceptance behavior and corrected their stale checkboxes. [Final release report](./FINAL_AUDIT.md): READY; the [complete matrix](./REQUIREMENT_TRACEABILITY.md) records every mandatory requirement and Definition of Done check.

## Execution Rule

For each task: inspect the current implementation, make the smallest scoped change, run the listed validation, review the diff, and report results using the format in `AGENTS.md`. Do not start a later task to compensate for an unfinished acceptance criterion.
