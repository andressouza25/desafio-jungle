# Pirate Battle — Master Specification

## 1. Purpose

This document defines the implementation requirements and architectural boundaries for the Jungle Gaming **Pirate Battle** technical challenge.

It translates the original challenge requirements into an implementation-oriented specification for both human developers and coding agents.

The goals of this specification are to:

- preserve all mandatory challenge requirements;
- establish clear architectural boundaries;
- reduce ambiguity during implementation;
- prevent scope drift between development tasks;
- provide traceable requirement IDs;
- serve as the primary implementation reference for coding agents.

This document does not replace the original Jungle Gaming challenge.

---

## 2. Source of Truth and Priority

Specification priority:

1. Original Jungle Gaming `docs/CHALLENGE.md`
2. `MASTER_SPEC.md`
3. Specialized specifications under `/docs`
4. `DESIGN_SYSTEM.md`
5. `TASKS.md`
6. Individual task instructions

No project document may weaken, remove, or contradict a requirement from the original Jungle Gaming challenge.

If a conflict is found, implementation must follow the highest-priority source and the conflict must be documented.

---

# 3. Product Overview

## PRODUCT-001

The application must implement a single-player 2D top-down naval shooter playable entirely in the browser.

## PRODUCT-002

The player must navigate a naval arena, fight enemy ships, survive attacks and accumulate points.

## PRODUCT-003

A match ends when:

- the configured match duration expires; or
- the player's health reaches zero.

## PRODUCT-004

Gameplay and gameplay configuration are local.

Ranking and Match History use simulated REST APIs.

## PRODUCT-005

The application must support desktop and mobile environments.

---

# 4. Required Technology Stack

The following technologies are mandatory and must actively participate in the implementation.

| Responsibility    | Technology     |
| ----------------- | -------------- |
| Application UI    | React          |
| Language          | TypeScript     |
| Game rendering    | PixiJS         |
| Remote state      | TanStack Query |
| HTTP client       | Axios          |
| API mocking       | MSW            |
| E2E testing       | Playwright     |
| Visual regression | Playwright     |

## TECH-001

TypeScript must operate in strict mode.

## TECH-002

React must be responsible primarily for application UI, menus, forms, panels and dialogs.

## TECH-003

PixiJS must render the gameplay arena, ships, projectiles, effects and ship indicators.

## TECH-004

Axios must be used for Ranking and Match History HTTP communication.

## TECH-005

TanStack Query must manage remote Ranking and Match History state.

## TECH-006

MSW must simulate the Ranking and Match History APIs.

## TECH-007

Playwright must provide E2E and visual regression testing.

---

# 5. Architectural Boundaries

The project must separate the following responsibilities:

```text
Application
│
├── React UI
│   ├── Main Menu
│   ├── Options
│   ├── Ranking
│   ├── Match History
│   ├── Result
│   └── Game Screen shell
│
├── Game
│   ├── Simulation
│   ├── Entities
│   ├── Input
│   ├── Combat
│   ├── Collision
│   ├── Spawning
│   └── Rendering
│
├── Data
│   ├── Axios
│   ├── TanStack Query
│   └── Persistence
│
└── Mock API
    ├── MSW handlers
    ├── Fixtures
    └── Network scenarios
```

## ARCH-001

Continuous gameplay state must remain inside the game simulation.

React must not be used as the per-frame game state engine.

## ARCH-002

Gameplay systems must not depend directly on React rendering.

## ARCH-003

React must not rerender every frame to reflect continuous simulation state.

## ARCH-004

Rendering, simulation, input and UI state must have clearly separated responsibilities.

## ARCH-005

Gameplay configuration must be centralized, typed and independent from gameplay algorithms.

## ARCH-006

The application must initialize and destroy correctly under React Strict Mode.

---

# 6. Application Screens

The application must contain the following major screens or views.

## SCREEN-001 — Main Menu

Must provide:

- Play;
- Options;
- gameplay controls/instructions;
- Ranking;
- Match History.

## SCREEN-002 — Options

Must allow configuration of:

- Game session time;
- Enemy spawn time.

Configuration must be validated and persisted.

## SCREEN-003 — Game

Must provide:

- PixiJS arena;
- HUD;
- gameplay controls;
- pause functionality;
- desktop controls;
- touch controls.

## SCREEN-004 — Result

Must display:

- final score;
- effective play time;
- match termination reason;
- match registration status;
- Play Again;
- Main Menu.

## SCREEN-005 — Ranking

Must display:

- player identification;
- scores;
- pagination;
- loading state;
- empty state;
- error state.

## SCREEN-006 — Match History

Must display:

- match date;
- score;
- effective duration;
- termination reason;
- pagination;
- loading state;
- empty state;
- error state.

---

# 7. Match Lifecycle

A match follows the state lifecycle:

```text
loading
   ↓
ready
   ↓
running
   ↔
paused
   ↓
ended
```

## MATCH-001

A new match must initialize:

- player health;
- score;
- timer;
- enemies;
- projectiles;
- cooldowns;
- spawn timers;
- match configuration snapshot.

## MATCH-002

Restarting must create a clean match.

No gameplay state from the previous match may leak into the new match.

## MATCH-003

The match must end when the timer reaches zero.

## MATCH-004

The match must end when player health reaches zero.

## MATCH-005

After the match ends, the simulation must stop:

- movement;
- attacks;
- damage;
- spawning;
- score changes;
- gameplay timers.

## MATCH-006

Leaving the active combat screen ends the active match.

## MATCH-007

Refreshing the page during combat abandons the active match.

## MATCH-008

Abandoned matches must not be registered in Ranking or Match History.

---

# 8. Gameplay

## 8.1 Player

## GAME-PLAYER-001

The player must move forward.

## GAME-PLAYER-002

The player must rotate left.

## GAME-PLAYER-003

The player must rotate right.

## GAME-PLAYER-004

The player must remain inside the visible arena.

## GAME-PLAYER-005

The player must not move through islands.

## GAME-PLAYER-006

The player must have limited health.

## GAME-PLAYER-007

Enemy projectiles must damage the player.

## GAME-PLAYER-008

Chaser collisions must damage the player.

## GAME-PLAYER-009

Movement and attacks must be usable simultaneously.

---

# 9. Weapons

The player has three attack commands:

```text
Front attack
Left broadside
Right broadside
```

## GAME-WEAPON-001

The front attack must fire one projectile in the ship's forward direction.

## GAME-WEAPON-002

The left broadside must fire three parallel projectiles from the left side.

## GAME-WEAPON-003

The right broadside must fire three parallel projectiles from the right side.

## GAME-WEAPON-004

Each weapon must have its own configured cooldown.

## GAME-WEAPON-005

Attacks must not fire while their cooldown is active.

---

# 10. Projectiles

## GAME-PROJECTILE-001

Projectiles must have configurable:

- direction;
- speed;
- damage;
- maximum range or lifetime.

## GAME-PROJECTILE-002

Player projectiles must damage enemies.

## GAME-PROJECTILE-003

Enemy projectiles must damage the player.

## GAME-PROJECTILE-004

Each projectile may apply damage only once.

## GAME-PROJECTILE-005

A projectile must be removed when it:

- hits a valid target;
- hits an obstacle;
- expires;
- leaves the arena.

---

# 11. Enemies

Two enemy types are mandatory.

```text
Enemy
├── Chaser
└── Shooter
```

Both must:

- move;
- rotate;
- receive damage;
- respect island collisions;
- stop participating in gameplay after destruction.

## GAME-ENEMY-001 — Chaser

The Chaser must pursue the player.

## GAME-ENEMY-002

The Chaser must cause damage when colliding with the player.

## GAME-ENEMY-003

The Chaser must destroy itself after impact with the player.

## GAME-ENEMY-004

Chaser self-destruction against the player must not award points.

## GAME-ENEMY-005 — Shooter

The Shooter must approach the player.

## GAME-ENEMY-006

The Shooter must attack when the player enters its configured attack range.

## GAME-ENEMY-007

Shooter attacks must respect a configured cooldown.

## GAME-ENEMY-008

Both Chaser and Shooter enemies must appear during a standard match.

---

# 12. Arena and Collision

## GAME-ARENA-001

The arena must contain water.

## GAME-ARENA-002

The arena must contain at least one island.

## GAME-ARENA-003

Islands must block ships.

## GAME-ARENA-004

Islands must block projectiles.

Required collision relationships include:

```text
Player ↔ Arena bounds
Player ↔ Island

Enemy ↔ Arena bounds
Enemy ↔ Island

Player projectile ↔ Enemy
Player projectile ↔ Island

Enemy projectile ↔ Player
Enemy projectile ↔ Island

Chaser ↔ Player
```

## GAME-COLLISION-001

Collision handling must prevent repeated damage from a projectile that has already resolved its collision.

## GAME-COLLISION-002

Destroyed enemies must immediately stop participating in collisions.

---

# 13. Enemy Spawning

## GAME-SPAWN-001

Enemies must spawn periodically until the match ends.

## GAME-SPAWN-002

Spawn interval must come from the current match configuration.

## GAME-SPAWN-003

Spawn locations must not overlap obstacles.

## GAME-SPAWN-004

Spawn locations must maintain sufficient distance from the player to avoid unavoidable immediate damage.

## GAME-SPAWN-005

Enemy distribution must be configurable.

---

# 14. Scoring

## GAME-SCORE-001

An enemy destroyed by a player attack awards exactly one point.

## GAME-SCORE-002

A Chaser destroyed by colliding with the player awards no points.

## GAME-SCORE-003

An enemy may award points at most once.

## GAME-SCORE-004

Score cannot change after the match has ended.

---

# 15. Game Simulation

## SIM-001

The simulation must be time-based.

## SIM-002

Movement must be independent from frame rate.

Conceptually:

```text
distance = speed × deltaTime
```

## SIM-003

The following systems must use simulation time rather than frame count:

- movement;
- projectiles;
- cooldowns;
- enemy spawning;
- match timer;
- enemy behavior;
- time-based effects.

## SIM-004

Simulation time must stop while the game is paused.

## SIM-005

Large frame gaps caused by pause, tab switching or temporary inactivity must not cause simulation jumps when gameplay resumes.

---

# 16. Gameplay Configuration

Gameplay parameters must exist in a centralized typed configuration.

The configuration must include at least:

```text
GameConfig
│
├── session
│   └── duration
│
├── player
│   ├── health
│   ├── movementSpeed
│   └── rotationSpeed
│
├── weapons
│   ├── front
│   ├── leftBroadside
│   └── rightBroadside
│
├── projectiles
│   ├── speed
│   ├── damage
│   └── lifetime/range
│
├── chaser
│   ├── health
│   └── movementSpeed
│
├── shooter
│   ├── health
│   ├── movementSpeed
│   ├── attackRange
│   └── cooldown
│
└── spawn
    ├── interval
    └── distribution
```

## CONFIG-001

Balance changes must not require modification of gameplay system logic.

## CONFIG-002

Game session duration must support values between 60 and 180 seconds.

## CONFIG-003

Enemy spawn interval must be positive.

Its allowed limits must be documented.

## CONFIG-004

Starting a match must create a configuration snapshot.

## CONFIG-005

Configuration changes after a match starts must only affect future matches.

---

# 17. Input System

## INPUT-001

Desktop keyboard controls must exist for:

- movement;
- left rotation;
- right rotation;
- front attack;
- left broadside;
- right broadside;
- pause.

## INPUT-002

Touch controls must provide equivalent gameplay capabilities.

## INPUT-003

Movement and attacks must support simultaneous input.

## INPUT-004

Gameplay keyboard events must only be captured while gameplay is active.

## INPUT-005

Input state must be cleared when gameplay pauses.

This prevents queued movement or attacks from being executed after resume.

---

# 18. Pause and Visibility

## PAUSE-001

The player must be able to pause manually.

## PAUSE-002

The game must automatically pause when:

- the browser tab becomes hidden; or
- the application loses focus.

## PAUSE-003

While paused, the following must stop:

- simulation;
- match timer;
- cooldowns;
- spawning;
- movement;
- attacks.

## PAUSE-004

Automatic pause must require explicit player action to resume.

## PAUSE-005

Input accumulated while paused must not execute after resume.

---

# 19. Assets and Rendering

## ASSET-001

Provided Jungle Gaming assets must form the visual foundation of the game.

## ASSET-002

Gameplay assets must load before combat begins.

## ASSET-003

Asset loading must expose visible progress or loading state.

## ASSET-004

Asset loading failures must be handled.

## ASSET-005

The player must be able to retry after recoverable loading failures.

## ASSET-006

Textures should be loaded once and reused where appropriate.

## ASSET-007

PixiJS resources, entities and listeners must be released correctly when gameplay is destroyed.

---

# 20. HUD and Gameplay Feedback

## HUD-001

The HUD must display:

- player health;
- score;
- remaining time.

## HUD-002

Player health must also be represented above the player ship.

## HUD-003

Enemy health must be represented above each enemy.

## FEEDBACK-001

Firing must have perceptible visual feedback.

## FEEDBACK-002

Damage and impacts must have perceptible feedback.

## FEEDBACK-003

Enemy destruction must have an explosion/destruction effect.

## FEEDBACK-004

Ships must visually deteriorate according to remaining health.

Feedback must not significantly reduce arena readability.

---

# 21. Ranking

## RANKING-001

Ranking data must be retrieved through the mocked REST API.

## RANKING-002

Ranking must support pagination.

## RANKING-003

Ranking must be ordered by score.

## RANKING-004

Only matches with equivalent gameplay configuration may be compared in the same ranking context.

## RANKING-005

Ties must use a deterministic tie-breaking rule.

## RANKING-006

Other players must be represented through fixtures.

---

# 22. Match History

## HISTORY-001

Completed matches must be registered through the mocked REST API.

## HISTORY-002

History must support pagination.

## HISTORY-003

Each record must contain:

- match ID;
- player ID;
- date;
- score;
- effective duration;
- termination reason;
- gameplay configuration.

---

# 23. Remote Data Management

## DATA-001

Axios must perform Ranking and Match History HTTP requests.

## DATA-002

TanStack Query must manage:

- loading;
- empty states;
- errors;
- cache;
- background updates;
- retries;
- invalidation.

## DATA-003

Ranking and Match History must refresh appropriately after successful match registration.

## DATA-004

Returning to Ranking or Match History must trigger the required data freshness behavior.

## DATA-005

Older delayed responses must not overwrite newer valid data.

---

# 24. Match Submission and Idempotency

## SUBMIT-001

Each completed match must have a unique match identifier.

## SUBMIT-002

A completed match must produce exactly one History record.

## SUBMIT-003

A completed match must produce exactly one Ranking entry.

## SUBMIT-004

Repeated submission of the same match must return the existing record rather than creating duplicates.

## SUBMIT-005

Repeated user actions must not create duplicate records.

## SUBMIT-006

A timeout occurring after server-side registration must be recoverable without duplication.

---

# 25. Pending Submission Recovery

## RECOVERY-001

Failed match submissions must be preserved locally.

## RECOVERY-002

Pending submissions must survive page refresh.

## RECOVERY-003

The user must be able to retry pending submissions.

## RECOVERY-004

Pending submission must not prevent the user from starting another match.

## RECOVERY-005

Recovered submissions must remain idempotent.

---

# 26. MSW and Network Scenarios

Development and tests must support reproducible network scenarios.

Required scenarios include:

## NETWORK-001

Successful requests.

## NETWORK-002

Empty lists.

## NETWORK-003

Multiple pages.

## NETWORK-004

Slow responses.

## NETWORK-005

Variable latency.

## NETWORK-006

Out-of-order responses.

## NETWORK-007

Timeouts.

## NETWORK-008

Connection failures.

## NETWORK-009

HTTP 4xx errors.

## NETWORK-010

HTTP 5xx errors.

## NETWORK-011

Ranking query failure.

## NETWORK-012

History query failure.

## NETWORK-013

Timeout after successful match registration.

## NETWORK-014

Unavailable API during match completion followed by successful recovery.

Network scenarios must be selectable and resettable.

Randomness and latency must be controllable during automated tests.

MSW must function in the deployed build.

---

# 27. Local Persistence

Local persistence must include:

## PERSIST-001

Player Options.

## PERSIST-002

Last completed match result.

## PERSIST-003

Confirmed mocked API records where required.

## PERSIST-004

Pending match submissions.

Gameplay state from an active match does not need to survive refresh.

---

# 28. Responsive and Mobile Behavior

## RESPONSIVE-001

The application must work on desktop.

## RESPONSIVE-002

The application must work on mobile.

## RESPONSIVE-003

The game must provide usable touch controls.

## RESPONSIVE-004

The supported mobile orientation must be explicitly defined.

## RESPONSIVE-005

The layout must adapt to viewport size changes.

## RESPONSIVE-006

Arena resizing must preserve gameplay proportions and logical rules.

## RESPONSIVE-007

Input coordinates must remain correct after resizing and device pixel density changes.

## RESPONSIVE-008

The HUD and arena must remain visible without unintended clipping.

---

# 29. Accessibility

## A11Y-001

Menus must support keyboard navigation.

## A11Y-002

Interactive elements must expose visible focus states.

## A11Y-003

Forms must provide accessible labels.

## A11Y-004

Dialogs must manage focus correctly.

## A11Y-005

Text and controls must maintain adequate contrast.

## A11Y-006

Validation and error messages must be accessible.

## A11Y-007

Score, remaining time and match state must also be exposed through semantic UI.

## A11Y-008

Accessibility announcements must not occur every simulation frame.

---

# 30. Testing

Playwright must cover the required application flows.

## TEST-001

Options navigation, validation and persistence.

## TEST-002

Asset loading, failure and retry.

## TEST-003

Match start.

## TEST-004

Player movement and rotation.

## TEST-005

Arena boundaries.

## TEST-006

Island collision.

## TEST-007

Front and broadside attacks.

## TEST-008

Damage and cooldown behavior.

## TEST-009

Score without duplication.

## TEST-010

Chaser behavior.

## TEST-011

Shooter behavior.

## TEST-012

Enemy spawning.

## TEST-013

Match ending by timeout.

## TEST-014

Match ending by player death.

## TEST-015

Clean restart.

## TEST-016

Pause and resume.

## TEST-017

Focus/visibility pause.

## TEST-018

Result screen and persistence.

## TEST-019

Match abandonment.

## TEST-020

Repeated screen navigation.

## TEST-021

Touch controls.

## TEST-022

Ranking states and pagination.

## TEST-023

Match History states and pagination.

## TEST-024

Match registration.

## TEST-025

Ranking and History refresh after registration.

## TEST-026

Pending submission recovery after refresh.

## TEST-027

Timeout retry without duplication.

## TEST-028

Out-of-order network responses.

---

# 31. Test Determinism

## TEST-DETERMINISM-001

Gameplay tests must support deterministic seeds.

## TEST-DETERMINISM-002

Tests must be able to control simulation time.

## TEST-DETERMINISM-003

Combat tests must execute real gameplay rules rather than bypassing them.

## TEST-DETERMINISM-004

Each automated test must begin from an isolated state.

---

# 32. Visual Regression

Visual regression baselines must be versioned for:

## VISUAL-001

Main Menu.

## VISUAL-002

Stable gameplay state.

## VISUAL-003

Result screen.

---

# 33. Browser Coverage

Primary gameplay flows must run in Chromium for:

- desktop viewport;
- mobile viewport.

---

# 34. Performance

## PERF-001

The optimized production build should target 60 FPS in the documented reference environment.

## PERF-002

Performance profiling must record:

- frame rate;
- 95th percentile frame time;
- entity count.

## PERF-003

Profiling must include a three-minute match.

## PERF-004

Memory behavior must be evaluated after five cycles of:

```text
start match
→ play
→ exit
```

## PERF-005

Continuous resource growth must be investigated.

## PERF-006

Profiling evidence must document:

- hardware;
- browser;
- resolution;
- match configuration;
- observed limitations.

---

# 35. Resource Lifecycle

## LIFECYCLE-001

Leaving gameplay must clean up:

- PixiJS ticker callbacks;
- keyboard listeners;
- pointer/touch listeners;
- visibility listeners;
- resize listeners;
- timers;
- entities;
- containers;
- temporary effects;
- other gameplay-owned resources.

## LIFECYCLE-002

Restarting gameplay must not create duplicate listeners or simulation loops.

## LIFECYCLE-003

Cleanup must work correctly under React Strict Mode development behavior.

---

# 36. Error Handling

## ERROR-001

Ranking API failures must not block gameplay.

## ERROR-002

History API failures must not block gameplay.

## ERROR-003

Match submission failures must not prevent another match from starting.

## ERROR-004

Recoverable errors must provide a clear retry mechanism where appropriate.

## ERROR-005

Expected application flows must not produce unhandled console errors.

---

# 37. Code Quality

## QUALITY-001

Application code, identifiers and project documentation must be written in English.

## QUALITY-002

Responsibilities must remain clearly separated.

## QUALITY-003

Avoid unexplained gameplay magic numbers.

Gameplay balance values belong in typed configuration.

## QUALITY-004

Do not introduce abstractions without a concrete responsibility.

## QUALITY-005

Prefer small cohesive systems over large multi-purpose game classes.

## QUALITY-006

Implementation must remain understandable enough to explain during technical review.

---

# 38. Documentation

The final solution must contain:

```text
README.md
ARCHITECTURE.md
```

## DOC-001

`README.md` must document:

- project setup;
- environment variables;
- controls;
- gameplay configuration;
- network scenario selection;
- network scenario reset;
- development command;
- build command;
- preview command;
- lint command;
- typecheck command;
- Playwright command;
- failure reproduction instructions.

## DOC-002

`ARCHITECTURE.md` must document:

- React/PixiJS integration;
- simulation lifecycle;
- collision strategy;
- resource management;
- local persistence;
- Ranking integration;
- Match History integration;
- API contracts;
- TanStack Query caching;
- pending submission recovery;
- gameplay balance decisions;
- known limitations.

---

# 39. Deployment

## DEPLOY-001

A public deployment is mandatory.

## DEPLOY-002

The deployed version must correspond to the submitted source code.

## DEPLOY-003

The application must remain functional after directly opening or refreshing its public URL.

## DEPLOY-004

MSW Ranking and Match History functionality must operate in the deployed application.

## DEPLOY-005

The final project must run from a clean checkout without private services.

---

# 40. Definition of Done

The project is considered complete only when:

- all mandatory gameplay mechanics work;
- both enemy types operate correctly;
- player attacks and collisions behave correctly;
- pause and resume work correctly;
- gameplay configuration is centralized;
- desktop controls work;
- touch controls work;
- required screens exist;
- Ranking works;
- Match History works;
- match submission is idempotent;
- failed submissions can recover;
- MSW scenarios work;
- required Playwright tests pass;
- visual regression baselines exist;
- resource cleanup has been verified;
- performance has been measured;
- accessibility requirements have been reviewed;
- documentation is complete;
- production build succeeds;
- public deployment works;
- expected application flows contain no unhandled console errors.

---

# 41. Non-Goals

Unless required by the original challenge, the project does not require:

- multiplayer gameplay;
- real authentication;
- real backend infrastructure;
- real production database;
- server-side gameplay simulation;
- physics engine integration;
- complex pathfinding;
- account management;
- matchmaking;
- monetization systems;
- additional game modes.

Features outside the challenge scope should not be implemented before mandatory requirements are complete.

---

# 42. Implementation Principle

Correctness and clarity have priority over unnecessary complexity.

When multiple solutions satisfy a requirement, prefer the solution that is:

1. easier to understand;
2. easier to test;
3. easier to explain;
4. easier to maintain;
5. sufficient for the challenge requirements.

The project should demonstrate engineering judgment rather than maximize architectural complexity.
