# TASK-11 — Pause, Feedback and Audio

## Objective

Finish pause behavior and add restrained visual/audio feedback for the existing gameplay events.

## References

- `MASTER_SPEC.md`: PAUSE-001–005, INPUT-005, FEEDBACK-001–004, SIM-004–005
- `DESIGN_SYSTEM.md`: sections 17–18, 22 and 29
- Supplied `sample_pause.png`, effects spritesheets and audio assets
- `AGENTS.md`: sections 10–14 and 17

## Skills

- `pixijs`
- `frontend-design`

## Scope

- Implement manual pause plus automatic pause on hidden tab or lost focus.
- Require explicit resume, clear held input and prevent elapsed-time jumps.
- Build an accessible pause dialog with managed focus and Resume as the primary action.
- Add supplied firing, impact, damage, destruction and health-deterioration visuals.
- Add appropriate cannon, impact, explosion, warning, ambience and UI sounds with lifecycle ownership and overlap control.
- Respect browser audio-start restrictions through a user gesture.

## Out of Scope

- New gameplay mechanics, screen shake-heavy effects or decorative particle excess.
- Touch layout and final responsive tuning.
- Changing combat truth from visual or audio callbacks.

## Acceptance Criteria

- Pause stops simulation, timer, cooldowns, movement, attacks and spawning.
- Hidden/blurred gameplay pauses automatically and never resumes without player action.
- No queued input executes after resume and no large-delta jump occurs.
- Feedback is immediate and readable; audio loops/effects stop when gameplay is destroyed.
- Dialog focus is trapped/restored appropriately and actions are keyboard accessible.

## Validation

- Run `typecheck`, `lint`, pause/lifecycle tests and `build`.
- Test manual, visibility and focus pause paths with controlled simulation time.
- Repeatedly pause, resume and exit while checking input state, focus, sound overlap and console errors.
