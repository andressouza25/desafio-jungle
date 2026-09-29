# Pirate Battle — Design System

## 1. Purpose

This document defines the visual and interaction rules for Pirate Battle.

The provided Jungle Gaming assets are the primary visual reference for the project.

The goal is not to redesign the supplied visual language, but to build a consistent interface around it.

For technical architecture and implementation rules, refer to `MASTER_SPEC.md`.

For mandatory challenge requirements, refer to the original `docs/CHALLENGE.md`.

When a task declares the `frontend-design` skill, use it only to refine composition, responsive behavior, hierarchy, interaction states, accessibility and visual polish within this design system. The supplied Jungle Gaming assets, reference screens and rules in this document remain authoritative; the skill must not replace the Pirate Battle visual language with a new direction.

---

# 2. Visual Direction

Pirate Battle should feel like a polished arcade-style naval game.

The visual language should communicate:

- pirate adventure;
- naval combat;
- readability;
- strong game-state feedback;
- playful arcade interaction.

Provided assets must drive the visual identity.

Avoid generic SaaS/dashboard aesthetics.

Avoid introducing a second visual style that conflicts with the supplied game assets.

---

# 3. Source Assets

Primary asset groups:

```text
assets/
├── png/
│   ├── default/
│   └── retina/
│
├── spritesheet/
├── sounds/
├── tilesheet/
└── reference images
```

Both default and retina versions are available.

Prefer existing assets before creating CSS replacements.

---

# 4. Reference Screens

The following files are visual references:

```text
assets/sample_menu.png
assets/sample_options.png
assets/sample_pause.png
assets/sample_ranking.png
assets/sample_history.png
assets/sample_result.png
assets/sample.png
assets/preview.png
```

Before implementing a related screen, inspect its reference image.

These references define visual direction, not necessarily rigid pixel-perfect layouts.

Responsive adaptations are expected where required.

---

# 5. UI Assets

Existing menu assets include:

```text
assets/png/default/ui/menu/
```

Available components include:

- Pirate Battle title;
- menu panel;
- primary buttons;
- secondary buttons;
- hover states;
- pressed states;
- disabled states.

These assets should be preferred when implementing major game UI elements.

Do not recreate existing visual components with unrelated CSS styling unless there is a technical or accessibility reason.

---

# 6. HUD Assets

Existing HUD assets include:

```text
assets/png/default/ui/hud/
```

Available elements include:

- player health frame;
- health fills;
- enemy health frame;
- enemy health fills;
- score icon;
- heart icon;
- time icon;
- counter panel.

The supplied HUD visual language should remain consistent throughout gameplay.

---

# 7. Health States

Health must provide both numeric/logical information and clear visual feedback.

Existing health colors support:

```text
Healthy  → Green
Warning  → Amber
Critical → Red
```

Enemy health uses the supplied enemy health assets.

Health state changes should remain immediately understandable without unnecessary animation.

Do not rely only on color when important information can also be communicated through bar length or semantic UI.

---

# 8. Controls

Existing control assets include:

- forward;
- turn left;
- turn right;
- fire front;
- fire left;
- fire right;
- pause;
- play;
- restart;
- settings;
- home;
- close;
- plus;
- minus.

Touch controls should use these assets where appropriate.

Round control assets provide:

- normal;
- hover;
- pressed.

Interactive state changes must be visually perceptible.

---

# 9. Buttons

Buttons must have consistent interaction states.

Expected states:

```text
Default
Hover
Focus
Pressed
Disabled
```

Use the provided button assets where applicable.

Keyboard focus must remain clearly visible even when the supplied artwork does not provide a dedicated focus sprite.

Focus styling may therefore use an additional accessible outline or equivalent indicator.

Disabled buttons must not respond to interaction.

---

# 10. Panels

Menu-like screens should use the supplied pirate-themed panel language.

Examples:

- Main Menu;
- Options;
- Ranking;
- Match History;
- Result;
- Pause dialog.

Panels should create clear separation from the game/background without introducing modern dashboard cards.

Avoid excessive nested panels.

---

# 11. Typography

Typography must prioritize readability over decoration.

Use a display-oriented treatment only where appropriate, such as:

- game title;
- major screen headings.

Use a highly readable font for:

- settings;
- ranking;
- history;
- instructions;
- status messages;
- gameplay information.

Do not use decorative pirate-style typography for dense information.

Font choices must be documented when introduced.

Avoid unnecessary font families.

---

# 12. Color System

Exact project tokens should be derived during UI implementation from the supplied assets rather than inventing an unrelated palette.

Semantic tokens should be used instead of scattered color values.

Recommended token roles:

```text
--color-background
--color-surface
--color-surface-elevated

--color-text-primary
--color-text-secondary
--color-text-muted

--color-accent
--color-accent-hover

--color-success
--color-warning
--color-danger

--color-focus
--color-overlay
```

Colors should visually harmonize with the supplied pirate/naval assets.

Do not hardcode repeated colors across components.

---

# 13. Spacing

Use a small consistent spacing scale.

Recommended base scale:

```text
4px
8px
12px
16px
24px
32px
48px
```

Prefer these values before introducing arbitrary spacing.

Gameplay HUD positioning may use specific values when required by the game composition.

---

# 14. Layout

Menus should prioritize a clear central hierarchy.

Typical structure:

```text
Game Title

Primary Content / Panel

Primary Action

Secondary Actions
```

Ranking and Match History may use wider layouts because of their data density.

Gameplay must prioritize arena visibility over decorative interface elements.

---

# 15. Gameplay HUD

The HUD must remain readable without obscuring important gameplay areas.

Required information includes:

- player health;
- score;
- remaining time.

HUD elements should remain visually grouped and predictable.

Avoid moving important HUD information during normal gameplay.

HUD elements should scale or reposition appropriately on smaller screens.

---

# 16. Ship Health Indicators

Player and enemy health indicators rendered through PixiJS must visually belong to the same system as the React HUD.

Health indicators must:

- remain readable;
- follow their corresponding ship;
- avoid excessive size;
- not obscure nearby gameplay;
- disappear when the entity is removed.

---

# 17. Gameplay Feedback

Combat actions must have immediate perceptible feedback.

Use provided effects for:

- cannon fire where applicable;
- impacts;
- fire/deterioration;
- explosions.

Feedback should communicate gameplay events without overwhelming the arena.

Avoid excessive screen shake, flashing or particles that reduce readability.

---

# 18. Sound

Provided sounds should be used where they improve game feedback.

Available categories include:

- cannon attacks;
- impacts;
- explosions;
- sailing;
- ocean ambience;
- score;
- health warning;
- time warning;
- game start;
- pause/resume;
- game complete/game over;
- UI interaction.

Audio must reinforce existing visual feedback rather than replace it.

Repeated sounds should avoid creating excessive audio clutter.

---

# 19. Main Menu

The Main Menu should visually prioritize:

1. Pirate Battle identity;
2. Play;
3. Options;
4. Ranking / Match History;
5. control instructions where appropriate.

Use `sample_menu.png` as the primary visual reference.

Play must remain the strongest primary action.

---

# 20. Options

Use `sample_options.png` as the visual reference.

Options must clearly expose:

- Game session time;
- Enemy spawn time.

Settings must provide:

- visible labels;
- current values;
- validation feedback;
- clear navigation back.

Do not hide required configuration behind complex controls.

---

# 21. Ranking and Match History

Use:

```text
sample_ranking.png
sample_history.png
```

as primary references.

Data must remain readable on both desktop and mobile.

Clearly distinguish:

- headers;
- rows;
- pagination;
- loading;
- empty state;
- error state.

Do not sacrifice readability to preserve decorative elements.

---

# 22. Pause

Use `sample_pause.png` as the visual reference.

The pause state must clearly communicate that simulation has stopped.

The overlay should visually separate paused UI from active gameplay.

Resume must be the primary action.

Other actions must remain visually secondary.

---

# 23. Result Screen

Use `sample_result.png` as the visual reference.

The result hierarchy should prioritize:

1. match outcome;
2. score;
3. relevant match information;
4. registration status;
5. Play Again;
6. Main Menu.

Play Again should normally be the primary action.

---

# 24. Responsive Design

The interface must adapt to desktop and mobile.

Do not design desktop and mobile as unrelated interfaces.

Preserve:

- visual hierarchy;
- game identity;
- action priority;
- information hierarchy.

Layouts may change when necessary for usability.

---

# 25. Breakpoints

Avoid creating many arbitrary breakpoints.

Start with content-driven responsive behavior.

A simple breakpoint strategy is preferred.

Suggested baseline:

```text
Mobile:  < 768px
Desktop: >= 768px
```

Additional breakpoints should only be introduced when the interface demonstrates a concrete need.

---

# 26. Mobile Gameplay

Touch gameplay controls must be:

- large enough to use reliably;
- separated enough to avoid accidental input;
- reachable during gameplay;
- visually consistent with supplied control assets.

Controls must not unnecessarily cover the player, enemies or important HUD information.

The final supported orientation must be documented.

Landscape should be evaluated first because the game uses a top-down combat arena and multiple simultaneous controls.

---

# 27. Interaction Targets

Touch targets should generally provide at least approximately 44×44 CSS pixels of usable interaction area.

The visible sprite may be smaller if the actual hit target remains sufficiently large.

Do not place critical touch actions too close together.

---

# 28. Accessibility

React UI must provide:

- keyboard navigation;
- visible focus;
- semantic controls;
- accessible labels;
- accessible form validation;
- appropriate dialog focus management;
- sufficient text contrast.

Do not remove focus outlines without providing an equivalent visible replacement.

Canvas-only information required by the challenge must also have a semantic representation.

---

# 29. Motion

Motion should communicate:

- interaction;
- combat;
- damage;
- destruction;
- state transitions.

Avoid animation that exists only for decoration when it harms clarity or performance.

UI transitions should be short and responsive.

Gameplay animation must not interfere with simulation correctness.

---

# 30. Loading and Error States

Loading must never appear as a frozen application.

Asset loading should show visible progress or status.

Remote data screens must provide distinct states for:

```text
Loading
Empty
Error
Content
```

Retry actions must be clearly identifiable when available.

---

# 31. Visual Consistency Rules

When implementing UI:

1. inspect the relevant supplied reference;
2. reuse provided assets when appropriate;
3. use existing design tokens;
4. preserve visual hierarchy;
5. verify desktop behavior;
6. verify mobile behavior;
7. verify keyboard focus;
8. avoid introducing unrelated visual patterns.

---

# 32. Avoid

Do not introduce:

- generic SaaS cards;
- glassmorphism;
- neon cyberpunk styling;
- unrelated gradients;
- excessive rounded containers;
- emoji as game UI icons;
- random icon libraries when an equivalent supplied asset exists;
- decorative animations that hurt gameplay readability;
- arbitrary colors outside the token system;
- unnecessary visual complexity.

The interface should look like part of the supplied Pirate Battle asset set, not like a generic web application placed around a canvas.

---

# 33. Implementation Principle

When a visual decision is unclear:

1. inspect the supplied reference images;
2. inspect the supplied UI assets;
3. preserve the existing visual language;
4. prioritize usability and accessibility;
5. choose the simplest consistent solution.

The supplied assets define the game's identity.

The design system exists to extend that identity consistently, not replace it.
