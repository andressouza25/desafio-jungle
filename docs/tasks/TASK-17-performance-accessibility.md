# TASK-17 — Performance and Accessibility

## Objective

Measure required performance and resource behavior, then resolve scoped accessibility gaps across the completed application.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project commands and runtime instructions
- `MASTER_SPEC.md` — PERF-001–006, LIFECYCLE-001–003, A11Y-001–008, RESPONSIVE-001–008 and ERROR-005
- `ARCHITECTURE.md` — simulation/rendering lifecycle and React/Pixi boundaries
- `DESIGN_SYSTEM.md` — accessibility, responsive, interaction and gameplay UI rules
- `AGENTS.md` — performance, testing and validation rules

## Skills

- `pixijs`
- `playwright`

Use `pixijs` when investigating PixiJS rendering, resource ownership, lifecycle or hot-path behavior.

Use `playwright` for reproducible browser workflows, lifecycle cycles and accessibility/user-interaction checks where appropriate.

## Scope

- Profile the optimized production build during a representative three-minute match.
- Record every performance datum required by PERF-002–006.
- Record FPS, p95 frame time and relevant entity count according to the specification.
- Document the exact reference environment used for measurements.
- Run five complete start → play → exit lifecycle cycles.
- Investigate unexplained continuous resource/memory growth across those cycles.
- Identify measurements before applying performance optimizations.
- Remove confirmed hot-path allocations or unnecessary work where measurements justify it.
- Remove confirmed duplicate loops, listeners or subscriptions.
- Fix confirmed PixiJS, audio and temporary-effect resource leaks.
- Preserve deterministic simulation and existing gameplay behavior.
- Audit menus, forms, dialogs, Result, Ranking, History and gameplay semantic status for required accessibility behavior.
- Verify keyboard operability and visible focus.
- Verify focus management/restoration.
- Verify labels, errors and dialog semantics.
- Verify required contrast.
- Verify semantic gameplay information without frame-level announcements.
- Verify desktop/mobile readability, overflow and touch usability.
- Document environment, measurements, findings, fixes and known limitations.

## Out of Scope

- Optimization without measurement evidence.
- Architecture rewrites.
- Visual redesign.
- New gameplay features.
- Unsupported browser targets.
- Universal FPS guarantees.
- Changing simulation/gameplay rules to improve benchmark results.
- Functionality assigned to TASK-18 or later tasks.

## Acceptance Criteria

- Performance evidence contains every datum required by PERF-002–006.
- Measurement environment is explicitly documented.
- The optimized production build targets 60 FPS in the documented reference environment.
- Actual measured FPS and p95 frame time are reported without overstating the result.
- Relevant entity-count measurement is documented.
- Five lifecycle cycles show no unexplained continuous resource growth.
- Confirmed leaks/duplicate ownership issues within scope are fixed.
- Required application UI is keyboard operable.
- Keyboard focus is visible and logically managed.
- Dialog focus behavior remains correct.
- Form/error states are semantically accessible.
- Required contrast meets the specification.
- Gameplay exposes sufficient semantic status without per-frame React updates or announcements.
- Desktop/mobile layouts remain readable and usable.
- Accessibility/performance fixes do not regress existing gameplay or E2E behavior.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant automated tests.
- Run the full Playwright suite as appropriate after fixes.
- Run `build`.
- Serve/profile the production build.
- Execute and record the three-minute performance profile.
- Execute and record five start → play → exit lifecycle cycles.
- Compare lifecycle/resource behavior across cycles.
- Complete keyboard-only checks.
- Complete focus-management checks.
- Complete screen-reader semantic checks.
- Complete contrast checks.
- Complete responsive/mobile/touch checks.
- Re-run affected measurements after performance/resource fixes.
