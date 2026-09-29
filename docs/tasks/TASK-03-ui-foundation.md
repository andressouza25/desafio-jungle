# TASK-03 — UI Foundation

## Objective

Create the shared pirate-themed UI foundation and usable Main Menu and Options screens from supplied assets.

## References

- `MASTER_SPEC.md`: SCREEN-001–002, CONFIG-002–005, PERSIST-001, A11Y-001–006
- `DESIGN_SYSTEM.md`: sections 2–14, 19–20, 24–25 and 27–32
- Supplied `sample_menu.png`, `sample_options.png` and matching UI assets
- `AGENTS.md`: sections 13–14 and 17

## Skills

- `frontend-design`

## Scope

- Derive semantic color, spacing, typography and focus tokens from supplied assets.
- Build shared buttons, panels, form controls and screen layout primitives with complete interaction states.
- Implement Main Menu hierarchy, controls/instructions access and navigation actions.
- Implement validated Game session time and Enemy spawn time settings with local persistence.
- Provide accessible labels, errors, keyboard navigation and initial desktop/mobile layout behavior.

## Out of Scope

- Game canvas, final gameplay controls or HUD.
- Ranking, Match History and Result content.
- New icon libraries or destructive edits to original assets.

## Acceptance Criteria

- Main Menu and Options visually follow their references without generic dashboard styling.
- Session duration accepts only 60–180 seconds; spawn interval is positive with documented limits.
- Saved options survive refresh and affect only future match snapshots.
- Focus, hover, pressed, disabled and validation states are perceivable and accessible.

## Validation

- Run `typecheck`, `lint`, relevant UI tests and `build`.
- Verify option validation and persistence through reload.
- Check keyboard navigation, visible focus, labels, contrast and overflow at representative desktop and mobile widths.
