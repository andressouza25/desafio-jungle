# TASK-16 — E2E and Visual Tests

## Objective

Complete deterministic Playwright coverage for required user-visible behavior and stable visual baselines.

## References

- `MASTER_SPEC.md`: TEST-001–028, TEST-DETERMINISM-001–004
- `MASTER_SPEC.md`: VISUAL-001–003 and Browser Coverage
- `AGENTS.md`: sections 15–17
- Existing unit/integration coverage and all implemented task acceptance criteria

## Skills

- `playwright` — use for real-browser workflows, diagnostics and artifacts; this task's required Playwright test specs remain authoritative.

## Scope

- Implement missing Playwright flows for Options, loading, gameplay, collisions, combat, enemies, match lifecycle, pause, touch, remote screens and recovery.
- Drive gameplay through real input → simulation → behavior → observable result paths.
- Add test-only control surfaces for seed, simulation time and network scenarios without bypassing production rules.
- Isolate storage, mock data and match state for every test.
- Version visual baselines for Main Menu, a stable gameplay state and Result.
- Configure traces, screenshots, video-on-failure as appropriate and an HTML report.

## Out of Scope

- Weakening production behavior or asserting private implementation details merely to make tests pass.
- Performance profiling and broad accessibility auditing.
- Cross-browser coverage beyond specified desktop/mobile Chromium unless explicitly required.

## Acceptance Criteria

- All TEST-001–028 scenarios have meaningful automated coverage.
- Repeated runs are deterministic and independent of order.
- Desktop and mobile Chromium projects cover primary gameplay flows.
- Required visual baselines are stable, reviewable and versioned.
- Failures provide enough artifacts to diagnose the user-visible cause.

## Validation

- Run `typecheck`, `lint`, the full Playwright suite and `build`.
- Repeat deterministic gameplay/network subsets to check flakiness.
- Review every new visual baseline and inspect an intentionally produced trace/report before restoring passing state.
