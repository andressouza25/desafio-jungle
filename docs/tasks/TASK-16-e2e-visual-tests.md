# TASK-16 — E2E and Visual Tests

## Objective

Complete deterministic Playwright coverage for required user-visible behavior and stable visual baselines.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project commands and workflows
- `MASTER_SPEC.md` — TEST-001–028, TEST-DETERMINISM-001–004, VISUAL-001–003 and Browser Coverage
- `ARCHITECTURE.md` — deterministic simulation, testability and application boundaries
- `AGENTS.md` — testing and validation rules
- Existing unit/integration coverage and implemented task acceptance criteria

## Skills

- `playwright`

Use for real-browser workflows, diagnostics, artifacts and stable E2E patterns.

The explicit Playwright requirements in `MASTER_SPEC.md` and this task remain authoritative.

## Scope

- Audit TEST-001–028 and map every requirement to meaningful automated coverage.
- Implement missing Playwright workflows for Options, loading, gameplay, collisions, combat, enemies, match lifecycle, pause, touch, remote screens and submission/recovery.
- Exercise gameplay through real user input → simulation → behavior → observable result whenever the requirement is user-visible.
- Add narrowly scoped test-only control surfaces for deterministic seed, simulation time and network scenarios.
- Ensure test controls configure production behavior rather than replacing/bypassing it.
- Isolate browser storage, mock API records, network scenarios and match state between tests.
- Cover primary flows in desktop Chromium and mobile Chromium according to the specified browser matrix.
- Add/version required visual baselines for Main Menu, deterministic gameplay state and Result.
- Keep screenshot states deterministic.
- Configure useful Playwright failure diagnostics including trace, screenshot and video where appropriate.
- Produce an HTML report.
- Keep E2E assertions focused on observable behavior rather than private implementation details.

## Out of Scope

- Weakening production behavior to satisfy tests.
- Duplicating unit-level implementation tests in Playwright without user-visible value.
- Exposing unrestricted production debug APIs.
- Performance profiling.
- Broad accessibility auditing.
- Cross-browser coverage beyond the browser matrix required by the specification.
- Functionality assigned to TASK-17 or later tasks.

## Acceptance Criteria

- TEST-001 through TEST-028 each map to meaningful automated coverage.
- TEST-DETERMINISM-001–004 are satisfied.
- Tests drive real user-facing flows where applicable.
- Test-only deterministic controls do not bypass production gameplay rules.
- Tests are independent of execution order.
- Storage, mock records, scenarios and match state are isolated between tests.
- Repeated deterministic runs produce the same expected outcomes.
- Required desktop and mobile Chromium coverage is present.
- VISUAL-001–003 have stable, reviewable and versioned baselines.
- Visual tests use deterministic state and avoid arbitrary timing.
- Failures retain enough artifacts to diagnose the user-visible cause.
- Full Playwright suite passes without hidden retries masking persistent flakiness.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run the complete Playwright suite.
- Run `build`.
- Verify the TEST-001–028 coverage map.
- Repeat deterministic gameplay subsets.
- Repeat deterministic network/recovery subsets.
- Run required desktop Chromium coverage.
- Run required mobile Chromium coverage.
- Review every new visual baseline manually.
- Intentionally produce one controlled failure and inspect its trace/report/artifacts.
- Restore the suite to passing state before completion.
