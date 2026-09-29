# Pirate Battle — Architecture

## 1. Purpose

This document defines the architectural boundaries of Pirate Battle.

It complements `MASTER_SPEC.md` and should evolve as the implementation grows.

Do not duplicate challenge requirements or implementation details here.

---

## 2. Architecture Overview

The application is divided into four main areas:

```text id="shx4iz"
React UI
   │
   ├── Game
   ├── Data
   └── Mock API
```

### React UI

Owns:

- screens and navigation;
- menus and forms;
- Ranking and Match History;
- Result and dialogs;
- application-level UI state.

### Game

Owns:

- simulation;
- entities;
- movement;
- combat;
- collisions;
- enemies;
- spawning;
- input;
- PixiJS rendering.

### Data

Owns:

- Axios;
- TanStack Query;
- API contracts;
- persistence.

### Mock API

Owns:

- MSW handlers;
- fixtures;
- simulated backend state;
- network scenarios.

---

## 3. React and Game Boundary

React must not run the game simulation.

Continuous gameplay state remains inside the Game layer.

Examples:

```text id="ry5j91"
position
rotation
projectiles
enemy movement
collisions
cooldowns
```

React communicates with the game through a small explicit interface.

```text id="u4xztg"
React
  │
  │ start / pause / resume / destroy
  ↓
GameController
  │
  │ score / health / time / match events
  ↓
React
```

React must not rerender every simulation frame.

---

## 4. Game Architecture

Initial structure:

```text id="p0m6qo"
game/
├── config/
├── core/
├── entities/
├── systems/
├── input/
├── rendering/
└── utils/
```

Expected systems include:

```text id="knvmsn"
InputSystem
MovementSystem
CombatSystem
ProjectileSystem
CollisionSystem
EnemySystem
SpawnSystem
```

The game controller coordinates systems but should not contain all gameplay logic.

Entities primarily contain state and identity.

---

## 5. Simulation

Simulation must be time-based and independent from rendering FPS.

```text id="ilvbxe"
deltaTime
   ↓
Movement
Combat
Projectiles
Enemies
Spawning
Match Timer
```

The simulation clock must support:

- pause;
- resume;
- deterministic testing;
- protection against excessive frame gaps.

PixiJS renders simulation state.

PixiJS objects must never become the source of gameplay truth.

```text id="29tkrj"
Simulation State
      ↓
PixiJS
```

---

## 6. Input

Keyboard and touch must share the same gameplay actions.

```text id="ry34rc"
Keyboard ─┐
          ├── InputState → Simulation
Touch ────┘
```

Browser events update input state.

They must not directly execute gameplay rules.

Input must be cleared when gameplay pauses, ends or is destroyed.

---

## 7. Configuration and Lifecycle

Gameplay balance must come from centralized typed configuration.

```text id="4rzcfk"
GameConfig
├── session
├── player
├── weapons
├── projectiles
├── enemies
└── spawn
```

Each match receives an immutable configuration snapshot.

Match lifecycle:

```text id="3n6w5k"
Loading
   ↓
Ready
   ↓
Running
   ↔
Paused
   ↓
Ended
   ↓
Destroyed
```

Restarting must create a clean match state.

Resources created by a game instance must be released when that instance is destroyed.

---

## 8. Data Architecture

Remote data follows:

```text id="gr21fo"
React
  ↓
TanStack Query
  ↓
API Functions
  ↓
Axios
  ↓
MSW
```

Ranking and Match History must follow this flow.

Local persistence must be isolated behind storage utilities.

Match submission must use a stable match ID and remain idempotent.

Failed submissions must be recoverable without blocking gameplay.

---

## 9. Dependency Rules

Keep dependencies flowing in one direction.

```text id="4d52cp"
React UI
   ↓
Application / Game APIs
   ↓
Game Domain
```

Rules:

- Game must not import React components.
- Systems must not depend on UI screens.
- Gameplay logic must not depend on DOM state.
- Rendering must not contain game rules.
- MSW must not depend on React.
- Avoid circular dependencies.
- Do not add architectural layers without a concrete responsibility.

---

## 10. Initial Source Structure

```text id="m36dsc"
src/
├── app/
├── components/
├── screens/
├── game/
│   ├── config/
│   ├── core/
│   ├── entities/
│   ├── systems/
│   ├── input/
│   ├── rendering/
│   └── utils/
├── features/
├── api/
├── mocks/
├── storage/
└── test/
```

This is a starting point.

Do not create empty folders only to reproduce this structure.

Update this document when implementation introduces an important architectural decision.

---

## Core Rule

Preserve these boundaries unless there is a documented reason to change them:

```text id="lvjka7"
React          = Application UI
Game           = Simulation and Rules
PixiJS         = Gameplay Rendering
TanStack Query = Remote State
Axios          = HTTP
MSW            = Mock API
Storage Layer  = Local Persistence
Playwright     = User-Level Validation
```

Prefer simple, explicit architecture over unnecessary abstraction.

---

## 11. TASK-00 Analysis and Implementation Plan

This plan records the repository state before bootstrap. It does not change the boundaries above.

### Repository evidence

- The project root contains specifications, the task roadmap, agent skills and `skills-lock.json`, but no application source, package manifest, tests or root Git metadata.
- During TASK-00, `original-challenge/` was an unchanged clone of Jungle Gaming's challenge at commit `3158914`. The preserved `docs/CHALLENGE.md` is the higher-priority source; the root `README.md` is this project's overview.
- The clone contained 520 assets. An identical copy is available at root `assets/`: 468 files under `png/`, 27 WAV sounds, 8 spritesheet files, 3 tilesheet files, 4 vector files and 10 root-level files. All eight named reference images are present.
- The references show a water-and-island arena, wood-and-gold controls and panels, a dark navy surface, a grouped health/score/time HUD and separate touch controls. The UI atlas provides default and retina variants with logical 1× metadata. Preserve those relationships while adapting layouts for smaller screens.
- The original README and `MASTER_SPEC.md` agree on the mandatory stack, gameplay, data flow, tests, performance and deployment requirements. The original also asks for a time estimate before implementation begins.

### Proposed implementation approach

- **Tooling:** In TASK-01, evaluate a minimal Vite/React/strict TypeScript setup with ESLint and Playwright. The required runtime stack is PixiJS, TanStack Query, Axios and MSW. Confirm compatible versions and install only then; avoid a router, physics engine, icon library or other dependency without a demonstrated need.
- **Source structure:** Use the starting structure in section 10 incrementally. `app` and `screens` own navigation and UI; `game` owns simulation, input and rendering adapters; `api`, `mocks` and `storage` own their named data responsibilities. Do not create empty directories to match the diagram.
- **Navigation and React/PixiJS boundary:** Prefer typed application-level screen state unless URL requirements justify routing. The Game screen mounts one game instance through a narrow controller interface. React sends lifecycle commands and receives event-driven or coarse HUD snapshots. PixiJS consumes simulation state to draw the arena and entities; neither React nor display objects hold per-frame gameplay truth.
- **Simulation and lifecycle:** Use an injectable clock and seeded randomness for deterministic tests. A fixed simulation step with bounded frame-gap handling is a candidate for frame-rate independence; pause freezes simulation time and clears input. Match start snapshots typed configuration, while end, abandonment, restart and destroy have distinct cleanup paths. Final step size and scheduling details belong to TASK-05 after the renderer integration is known.
- **Input and collision:** Keyboard and touch adapters update shared actions; systems consume them during simulation steps. Use logical arena, ship and obstacle shapes independent of PixiJS for collision and safe spawning. Choose concrete shapes and dimensions after inspecting the supplied sprites; avoid a physics dependency unless simple deterministic checks prove insufficient.
- **Assets and resources:** Use the supplied asset inventory and references to choose texture manifests and UI tokens. Load required gameplay assets before combat, show progress and retry on failure, reuse cached textures, and assign one owner for canvas, ticker callbacks, listeners, display objects, effects and audio. Teardown must tolerate React Strict Mode remounting. Keep the reference clone unchanged.
- **Data and persistence:** Keep gameplay local. Ranking and History follow React → TanStack Query → typed API functions → Axios → MSW. Storage utilities own Options, last result, confirmed mock records and pending submissions. A stable match ID supports idempotent submission and recovery after ambiguous timeouts.
- **Testing:** Add deterministic unit tests around simulation and collision where useful, then Playwright tests for real input-to-result flows, desktop/mobile Chromium, network scenarios and required visual baselines. Isolate storage and mock state per test. Profile the production build and repeated lifecycle cycles in the later dedicated tasks.

### Dependencies and unresolved decisions

- Exact collision shapes, visual tokens and asset-loading bundles remain implementation decisions after inspecting individual sprites and atlas data in TASK-03/04/07; the overview references alone do not settle them.
- Preliminary delivery estimate: 80–120 focused hours for gameplay, UI, mock APIs, automated tests, profiling and deployment. Reassess after TASK-01 clarifies tooling and build constraints.
- `CONFIG-003` requires documented positive spawn-interval limits but does not specify their bounds. Choose and document them when Options and typed configuration are implemented.
- Keyboard mapping, supported mobile orientation, deployment host and profiling environment remain decisions for their respective tasks.
- The installed `pixijs` skill routes Application, Assets and Ticker guidance to specialized sibling skills, but those files are not installed locally. Validate concrete PixiJS API choices from available authoritative documentation when implementing TASK-04/05; this analysis makes no API-specific assumption.
- **Final repository source of truth:** `docs/CHALLENGE.md` preserves the official README from commit `3158914`, with only a source note added. Root `assets/` was verified against the upstream commit. The nested clone was for TASK-00 inspection only and is excluded from the final repository.

## 12. TASK-02 Application Foundation

Navigation uses a typed, in-memory screen identifier in React; no URL routing requirement currently justifies a router. A single TanStack Query client is provided at the application root, with no requests yet. The Game screen owns the future session attachment point: leaving for Main Menu abandons and destroys an attached session, while its unmount cleanup destroys any remaining session. The Result route is only a reachable placeholder, not a completed match. Mock API and storage modules will be added when they have behavior, rather than creating empty directories now.
