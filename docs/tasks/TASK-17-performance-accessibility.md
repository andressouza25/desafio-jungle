# TASK-17 — Performance and Accessibility

## Objective

Measure required performance and resource behavior, then resolve scoped accessibility gaps across the completed application.

## References

- `MASTER_SPEC.md`: PERF-001–006, LIFECYCLE-001–003, A11Y-001–008
- `MASTER_SPEC.md`: RESPONSIVE-001–008 and ERROR-005
- `DESIGN_SYSTEM.md`: sections 15–18, 24–32
- `AGENTS.md`: sections 10, 15 and 17

## Skills

- `pixijs`
- `playwright`

## Scope

- Profile the optimized build for a three-minute match, recording FPS, p95 frame time and entity count.
- Run five start → play → exit cycles and investigate continuous resource/memory growth.
- Remove confirmed hot-path allocations, duplicate loops/listeners or leaked Pixi/audio/effect resources within scope.
- Audit menus, forms, dialogs, data screens and gameplay semantic status for keyboard, focus, labels, contrast and announcement frequency.
- Verify desktop/mobile readability, overflow and touch usability.
- Document hardware, browser, resolution, configuration, findings and limitations.

## Out of Scope

- Unmeasured optimization, architecture rewrites or visual redesign.
- New gameplay features or unsupported browser targets.
- Claiming a universal FPS guarantee beyond the documented reference environment.

## Acceptance Criteria

- Performance evidence includes every PERF-002–006 datum and a documented environment.
- The production build targets 60 FPS in that environment; observed limitations are explicit.
- Five lifecycle cycles show no unexplained continuous resource growth.
- Required UI is keyboard operable with visible focus, accessible errors/dialogs and sufficient semantic gameplay information.
- Announcements and React updates do not occur every simulation frame.

## Validation

- Run `typecheck`, `lint`, automated tests and `build`.
- Execute and record the three-minute profile plus five lifecycle cycles against the production build.
- Complete keyboard-only, focus, screen-reader semantics, contrast and responsive/touch checklists.
