# TASK-11 — Pause, Feedback and Audio

## Objective

Finish pause behavior and add restrained visual/audio feedback for existing gameplay events.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — PAUSE-001–005, INPUT-005, FEEDBACK-001–004 and SIM-004–005
- `ARCHITECTURE.md` — simulation, event, rendering and UI boundaries
- `DESIGN_SYSTEM.md` — pause, feedback and audio visual rules
- Supplied `sample_pause.png`, effects spritesheets and audio assets
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`
- `frontend-design`

Use `pixijs` for gameplay visual effects and rendering lifecycle integration.

Use `frontend-design` for the accessible pause dialog and related UI interaction.

Supplied assets, references and `DESIGN_SYSTEM.md` remain the visual source of truth.

## Scope

- Implement manual pause through the existing action-based input architecture.
- Automatically pause active gameplay when the document becomes hidden or the game loses focus.
- Never automatically resume after visibility or focus returns.
- Require an explicit player Resume action.
- Clear held gameplay input when pausing.
- Preserve the simulation-time guarantees established in TASK-05 so resume cannot introduce elapsed-time jumps.
- Build an accessible pause dialog following the supplied reference.
- Manage dialog focus, keyboard interaction and focus restoration.
- Keep Resume as the primary pause action.
- React to existing gameplay events with supplied firing, impact, damage, destruction and health-deterioration visual feedback.
- Add appropriate cannon, impact, explosion, warning, ambience and UI sounds using supplied audio assets.
- Respect browser audio-start restrictions through a valid user gesture.
- Explicitly own and clean up audio loops, effect playback and feedback resources.
- Apply reasonable overlap/concurrency control for frequently repeated sounds.

## Out of Scope

- New gameplay mechanics.
- Changes to combat truth from visual or audio callbacks.
- Excessive screen shake.
- Decorative particle excess.
- Touch layout.
- Final responsive tuning.
- New visual/audio assets when suitable supplied assets exist.
- Functionality assigned to TASK-12 or later tasks.

## Acceptance Criteria

- Manual pause stops simulation advancement.
- Hidden or unfocused active gameplay pauses automatically.
- Returning to the tab/window never automatically resumes gameplay.
- Pause stops timer, cooldowns, movement, attacks, enemy AI, projectiles and spawning through the existing simulation lifecycle.
- Held input is cleared when pause begins.
- No queued input executes after resume.
- Resume cannot introduce a large-delta simulation jump.
- Pause dialog manages focus correctly and is fully keyboard accessible.
- Existing gameplay events produce immediate and restrained visual/audio feedback.
- Visual/audio feedback never determines gameplay outcomes.
- Repeated sound effects have controlled overlap.
- Audio loops and effects stop when gameplay is ended/destroyed as appropriate.
- Strict Mode/remounting does not duplicate listeners, audio loops or feedback resources.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant pause, lifecycle and feedback tests.
- Run `build`.
- Test manual pause/resume with controlled simulation time.
- Test document visibility pause.
- Test focus-loss pause.
- Verify visibility/focus restoration does not automatically resume.
- Test held input during pause transitions.
- Verify no large-delta jump after resume.
- Verify pause-dialog focus trap and restoration.
- Exercise firing, impact, damage and destruction feedback.
- Exercise warning/health-deterioration feedback.
- Repeatedly pause, resume, exit and remount gameplay while checking audio loops, sound overlap, listeners and console errors.
