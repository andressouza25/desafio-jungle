# TASK-12 — Mobile and Responsive Gameplay

## Objective

Make all required gameplay actions usable on mobile while preserving the same simulation and desktop behavior.

## References

- `MASTER_SPEC.md`: INPUT-002–005, RESPONSIVE-001–008, TEST-021
- `DESIGN_SYSTEM.md`: sections 24–27 and 31–33
- Supplied touch-control assets
- `AGENTS.md`: sections 11, 13–17

## Skills

- `pixijs`
- `frontend-design`

## Scope

- Define and document the supported mobile orientation after evaluating landscape first.
- Map touch controls to the existing shared actions for movement, rotation, three attacks and pause.
- Support simultaneous movement and attack pointers with correct release/cancel handling.
- Adapt HUD, arena and controls to viewport and safe-area changes without covering critical gameplay.
- Maintain logical coordinates through resize, orientation and DPR changes.
- Provide approximately 44×44 CSS pixel hit areas and accessible labels for touch controls.

## Out of Scope

- Separate mobile game rules or duplicated touch-only simulation logic.
- Native application packaging or unsupported orientations.
- Ranking and History responsive tables, which belong to TASK-14.

## Acceptance Criteria

- Every required gameplay action works through touch and simultaneous actions are reliable.
- Pointer cancellation, pause, end and destroy clear all touch state.
- HUD, controls and arena remain visible without unintended clipping at supported sizes.
- Resize/orientation/DPR changes preserve input accuracy and world proportions.
- Existing keyboard behavior remains unchanged.

## Validation

- Run `typecheck`, `lint`, touch/responsive tests and `build`.
- Run the gameplay flow in the Playwright mobile Chromium project.
- Check representative small/large mobile and desktop viewports, orientation changes, touch target size and critical-content obstruction.
