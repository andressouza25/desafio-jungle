# TASK-12 — Mobile and Responsive Gameplay

## Objective

Make all required gameplay actions usable on mobile while preserving the same simulation and desktop behavior.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — INPUT-002–005, RESPONSIVE-001–008 and TEST-021
- `ARCHITECTURE.md` — shared input, viewport, rendering and simulation boundaries
- `DESIGN_SYSTEM.md` — responsive gameplay and touch-control rules
- Supplied touch-control assets and relevant mobile gameplay references
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`
- `frontend-design`

Use `pixijs` for viewport, canvas and rendering integration.

Use `frontend-design` for touch-control layout, responsive HUD behavior, accessibility and interaction quality.

Supplied assets, references and `DESIGN_SYSTEM.md` remain the visual source of truth.

## Scope

- Evaluate landscape first and define/document the supported mobile gameplay orientation.
- Map touch controls to the existing shared gameplay actions for movement, rotation, three attacks and pause.
- Use Pointer Events and pointer identity to support reliable multi-touch input.
- Support simultaneous movement, rotation and attack pointers where actions are compatible.
- Correctly handle pointer release, cancellation and interrupted interactions.
- Clear touch input on pause, match end, focus/visibility interruption and game destruction.
- Adapt HUD, arena and touch controls to supported viewport sizes and safe-area insets.
- Prevent controls/HUD from obscuring critical gameplay areas.
- Preserve logical world coordinates through viewport resize, orientation and DPR changes.
- Provide approximately 44×44 CSS pixel minimum interactive hit areas.
- Provide accessible names/labels for touch controls.
- Preserve existing keyboard controls and shared simulation behavior.

## Out of Scope

- Separate mobile game rules.
- Touch-specific simulation systems.
- Native application packaging.
- Unsupported orientations.
- Ranking and Match History responsive tables.
- Changes to existing combat rules.
- Functionality assigned to TASK-13 or later tasks.

## Acceptance Criteria

- Every required gameplay action can be triggered through touch.
- Touch and keyboard feed the same action-based input architecture.
- Compatible simultaneous touch actions work reliably.
- Individual pointer release/cancellation does not incorrectly release unrelated active actions.
- Pause, end, focus/visibility interruption and destroy clear all touch state.
- HUD, controls and arena remain usable without unintended clipping at supported mobile sizes.
- Critical gameplay content is not unnecessarily obscured by touch controls.
- Safe-area insets are respected where applicable.
- Resize, orientation and DPR changes preserve input accuracy, logical coordinates and world proportions.
- Touch targets are approximately 44×44 CSS pixels or larger.
- Touch controls have accessible labels.
- Existing keyboard behavior remains unchanged.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant touch/input/responsive tests.
- Run `build`.
- Run gameplay through the Playwright mobile Chromium project.
- Test simultaneous multi-pointer actions.
- Test pointer release and cancellation independently.
- Test pause/end/destroy with active pointers.
- Test representative small and large mobile viewports.
- Test the supported orientation and orientation changes.
- Test viewport and DPR changes.
- Verify touch target sizes and accessible labels.
- Check critical-content obstruction.
- Regression-test existing desktop keyboard gameplay.
