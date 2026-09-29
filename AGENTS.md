# Pirate Battle — Agent Instructions

## 1. Purpose

This file defines how coding agents must work in this repository.

Do not use this file as a replacement for the project specifications.

---

## 2. Required Reading

Before implementing any task, read:

1. `docs/CHALLENGE.md` (the original Jungle Gaming challenge)
2. `README.md` (this project's overview)
3. `MASTER_SPEC.md`
4. the current task instructions

Additionally, read `DESIGN_SYSTEM.md` whenever the task affects:

- UI;
- layout;
- styling;
- responsive behavior;
- HUD;
- visual feedback;
- accessibility.

Inspect existing code before making changes.

Do not assume the current implementation matches the specifications.

---

## 3. Source Priority

When instructions conflict, follow:

1. original Jungle Gaming `docs/CHALLENGE.md`;
2. `MASTER_SPEC.md`;
3. specialized project documentation;
4. `DESIGN_SYSTEM.md`;
5. current task.

Never remove or weaken a mandatory challenge requirement.

If a meaningful conflict exists, report it before making an irreversible architectural change.

---

## 3.1 Skills

Individual task files may declare relevant project skills in a `## Skills` section.

Before executing a task that declares a skill:

1. locate and read that skill's actual `SKILL.md`;
2. load only the specialized resources relevant to the current task;
3. use the skill as implementation guidance within the task's existing scope.

Skills do not override the source priority above, project architecture, mandatory technologies, supplied assets or task boundaries. If skill guidance conflicts with project documentation, follow the project documentation and report the conflict.

Do not use a skill to introduce unnecessary dependencies, abstractions, visual redesigns or scope expansion. In particular, `frontend-design` applies only to UI composition, responsive behavior, hierarchy, interaction states, accessibility and visual polish; it must not define gameplay or domain architecture.

If a declared skill or a required routed resource cannot be located, report that limitation instead of inventing its instructions.

---

## 4. Work One Task at a Time

Implement only the current task.

Do not proactively implement future tasks.

Small supporting changes are allowed only when required to complete the current task correctly.

Do not use an unrelated task as an opportunity to:

- redesign architecture;
- reorganize folders;
- replace libraries;
- rewrite working systems;
- add speculative abstractions.

---

## 5. Plan Before Editing

Before significant implementation:

1. inspect relevant files;
2. identify existing patterns;
3. identify the smallest required change;
4. determine affected systems;
5. verify the task against the specifications.

For non-trivial tasks, briefly state the implementation plan before editing.

---

## 6. Architecture Rules

Preserve the boundaries defined in `MASTER_SPEC.md`.

In particular:

- React is not the game engine;
- continuous gameplay state stays outside React rendering;
- PixiJS handles gameplay rendering;
- simulation logic must remain independent from frame rate;
- gameplay configuration must remain centralized;
- rendering must not become the source of gameplay truth;
- remote server state belongs to TanStack Query;
- browser events should feed the input system rather than contain gameplay logic.

Do not introduce architectural exceptions silently.

---

## 7. TypeScript

TypeScript must remain in strict mode.

Prefer:

- explicit domain types;
- discriminated unions when appropriate;
- typed configuration;
- typed API contracts;
- narrow interfaces.

Avoid:

- `any`;
- unsafe type assertions;
- duplicated domain types;
- suppressing TypeScript errors.

If an exception is unavoidable, document the reason.

---

## 8. Gameplay Rules

Gameplay behavior must follow the original challenge.

Do not invent additional mechanics unless explicitly requested.

Do not hardcode balance values inside gameplay systems.

Values such as:

- health;
- speed;
- damage;
- cooldowns;
- ranges;
- spawn intervals;
- projectile lifetime

must come from centralized configuration.

All time-dependent gameplay must use simulation time.

---

## 9. React Rules

Do not update React state every gameplay frame.

React should receive only UI-relevant snapshots or events from the simulation.

Avoid unnecessary effects and duplicated state.

Effects that create external resources must provide cleanup.

Implementation must remain safe under React Strict Mode.

---

## 10. PixiJS Rules

PixiJS objects must have clear lifecycle ownership.

When creating:

- ticker callbacks;
- containers;
- sprites;
- textures where applicable;
- pointer handlers;
- temporary effects;

ensure they are correctly released or reused.

Do not create multiple active game loops.

Do not repeatedly load the same asset without a reason.

---

## 11. Input Rules

Keyboard and touch controls should map to shared gameplay actions.

Browser input handlers should update input state.

Gameplay systems consume that state.

Input must be cleared when:

- gameplay pauses;
- gameplay ends;
- gameplay loses focus where required;
- the game instance is destroyed.

---

## 12. Data Rules

Use:

- Axios for HTTP;
- TanStack Query for remote state;
- MSW for API simulation.

Do not bypass these required technologies for Ranking or Match History.

Match submission must remain idempotent.

Network failures must not block gameplay.

Pending submissions must remain recoverable according to the challenge.

---

## 13. UI and Design

For visual tasks:

1. read `DESIGN_SYSTEM.md`;
2. inspect the relevant supplied reference image;
3. inspect available Jungle Gaming assets;
4. reuse existing assets where appropriate.

Do not replace the supplied visual language with generic application styling.

Accessibility takes priority when supplied artwork does not provide a required interaction state.

---

## 14. Assets

Before creating a new visual asset or adding an icon library, check whether an equivalent asset already exists under `assets/`.

Prefer supplied assets.

Do not modify original challenge assets destructively.

Derived or optimized assets must remain traceable to their source.

---

## 15. Testing

Every task must be validated at the appropriate level.

When available, run relevant:

```text id="cxf02r"
typecheck
lint
tests
build
```

Do not claim a command passed unless it was actually executed.

When a task changes gameplay behavior, verify the affected gameplay flow.

When a task fixes a bug, add or update a regression test when practical.

---

## 16. Playwright

Playwright tests should exercise real user-visible behavior.

Gameplay tests should prefer:

```text id="6z6u7s"
input
→ simulation
→ behavior
→ observable result
```

Do not make a test pass by bypassing the gameplay system being tested.

Keep tests deterministic.

Each test must start from an isolated state.

---

## 17. Responsive and Accessibility Checks

For UI changes, verify relevant behavior on:

- desktop;
- mobile.

Also check:

- keyboard navigation;
- focus visibility;
- labels;
- overflow;
- text readability;
- touch target usability where applicable.

---

## 18. Dependencies

Do not install a dependency without a concrete need.

Before adding one:

1. verify existing dependencies cannot reasonably solve the problem;
2. confirm it does not duplicate required stack functionality;
3. prefer maintained and focused packages.

Explain newly introduced dependencies in the task summary.

---

## 19. Refactoring

Refactor only when:

- required by the current task;
- necessary to maintain correctness;
- removing a clear blocker;
- explicitly requested.

Avoid unrelated cleanup during feature tasks.

Large refactors should be separate tasks.

---

## 20. Documentation

Update documentation when a task changes:

- architecture;
- setup;
- commands;
- controls;
- configuration;
- network scenarios;
- important technical decisions.

Do not duplicate documentation unnecessarily.

---

## 21. Do Not

Do not:

- implement the entire challenge in one task;
- change mandatory technologies;
- move gameplay state into React;
- couple simulation correctness to FPS;
- scatter magic gameplay numbers;
- ignore cleanup;
- suppress errors to make validation pass;
- weaken tests to accommodate broken behavior;
- replace supplied assets unnecessarily;
- introduce unrelated features;
- perform large refactors without scope justification.

---

## 22. Task Completion

Before declaring a task complete:

1. review the task scope;
2. review the resulting diff;
3. remove accidental or unrelated changes;
4. run relevant validation;
5. confirm acceptance criteria;
6. identify any known limitation.

A task is not complete merely because the code compiles.

---

## 23. Final Response Format

At the end of each implementation task, report:

### Implemented

Briefly describe what changed.

### Files Changed

List the main files created or modified.

### Validation

Report commands or checks actually executed and their results.

### Decisions

Mention important implementation decisions, if any.

### Remaining

Report known limitations or intentionally deferred work.

Do not report deferred future features as defects when they are outside the current task.

---

## 24. Guiding Rule

Prefer the smallest correct implementation that satisfies the current task and preserves the project architecture.

Build incrementally.

Do not optimize for the amount of code produced.

Optimize for correctness, clarity, testability and explainability.
