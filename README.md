# Pirate Battle

A 2D top-down naval shooter developed for the **Jungle Gaming Frontend Game Developer Challenge**.

The game is built with React, TypeScript and PixiJS and runs entirely in the browser.

Players navigate a naval arena, avoid islands, fight enemy ships and accumulate points until the match ends.

> This project is currently under development.

---

## Challenge

The objective is to build a complete browser-based naval shooter demonstrating:

- gameplay architecture;
- PixiJS rendering;
- React integration;
- TypeScript;
- responsive controls;
- remote state management;
- API mocking;
- automated testing;
- accessibility;
- performance awareness.

The implementation follows the requirements provided by Jungle Gaming in the original challenge specification.

The [original challenge specification](./docs/CHALLENGE.md) is preserved for reference. Its supplied assets are available under [`assets/`](./assets/).

---

## Tech Stack

### Core

- React
- TypeScript
- PixiJS

### Data

- TanStack Query
- Axios
- MSW

### Testing

- Playwright

Vite provides the development and production build tooling. ESLint checks the source, and Playwright runs browser tests.

---

## Game Overview

Pirate Battle is a single-player naval combat game viewed from a top-down perspective.

The player controls a ship capable of:

- moving forward;
- rotating left and right;
- firing a frontal cannon;
- firing left and right broadsides.

The arena contains islands and enemy ships.

Two enemy types are required:

### Chaser

Pursues the player and causes damage by colliding with the player's ship.

### Shooter

Approaches the player and attacks from range.

Destroying enemies through player attacks awards points.

A match ends when:

- the configured match timer reaches zero; or
- the player's health reaches zero.

---

## Application

The project contains the following main experiences:

```text
Main Menu
├── Play
├── Options
├── Ranking
└── Match History

Game
├── Arena
├── HUD
├── Controls
└── Pause

Result
├── Match summary
├── Registration status
├── Play Again
└── Main Menu
```

---

## Architecture

The application separates web UI from the continuous game simulation.

```text
React
│
├── Menus
├── Options
├── Ranking
├── Match History
├── Result
└── Application UI

Game
│
├── Simulation
├── Input
├── Entities
├── Movement
├── Combat
├── Collision
├── Spawning
└── PixiJS Rendering

Data
│
├── TanStack Query
├── Axios
└── Persistence

Mock API
│
├── MSW
├── Fixtures
└── Network Scenarios
```

React is not used as the per-frame game engine.

Continuous gameplay state remains inside the game simulation, while PixiJS handles gameplay rendering.

See [`MASTER_SPEC.md`](./MASTER_SPEC.md) for the complete architectural rules.

---

## Project Documentation

Project decisions are separated across focused documents.

### `README.md`

Project overview, setup and usage documentation.

### `MASTER_SPEC.md`

Global architecture and implementation decisions.

### `DESIGN_SYSTEM.md`

Visual language, UI rules, responsive behavior and accessibility guidelines.

### `AGENTS.md`

Development rules and instructions for coding agents.

### `ARCHITECTURE.md`

Final documentation of the implemented architecture.

This file will evolve alongside the implementation.

### [`docs/TASKS.md`](./docs/TASKS.md)

Incremental implementation plan used during development.

---

## Assets

The challenge provides the visual and audio assets used as the foundation of the game.

Available assets include:

- ships;
- ship parts;
- islands and environment tiles;
- projectiles;
- explosions;
- fire effects;
- HUD elements;
- menu components;
- touch controls;
- spritesheets;
- sound effects;
- ambient audio.

Reference screens are also provided for:

- Main Menu;
- Options;
- Pause;
- Ranking;
- Match History;
- Result.

The project should preserve and extend the visual language of these supplied assets.

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## Gameplay Configuration

Gameplay balance is centralized in typed configuration.

This includes values such as:

- match duration;
- player health;
- movement speed;
- rotation speed;
- weapon cooldowns;
- projectile speed;
- projectile damage;
- enemy health;
- enemy speed;
- Shooter attack range;
- spawn interval;
- enemy distribution.

Each match receives a configuration snapshot when it starts.

The Options screen saves two settings in browser storage: **Game session time** (60–180 seconds, default 120) and **Enemy spawn time** (1–30 seconds, default 3). Changes require **Save Changes**. Start and restart read current Options and create an immutable `GameConfig` snapshot; subsequent changes cannot alter an active match. Balance defaults live in `src/game/config/GameConfig.ts`. Movement and player weapons use their snapshotted values; enemies and damage application are not implemented yet.

---

## Ranking and Match History

Ranking and Match History are implemented through simulated REST APIs.

The data flow is:

```text
React
  ↓
TanStack Query
  ↓
Axios
  ↓
REST API
  ↓
MSW
```

The implementation supports the network and recovery scenarios required by the challenge, including idempotent match submission and pending submission recovery.

---

## Testing

Playwright is used for:

- end-to-end testing;
- gameplay flows;
- desktop testing;
- mobile testing;
- network failure scenarios;
- visual regression.

Gameplay testing is designed around deterministic simulation behavior where required.

---

## Performance

The game targets **60 FPS** in the documented reference environment.

Performance evaluation includes:

- frame rate;
- frame-time measurements;
- entity count;
- memory behavior;
- repeated game lifecycle testing.

Profiling results will be documented when the implementation reaches the performance validation stage.

---

## Development

The project is being implemented incrementally through small, isolated tasks.

Each task defines:

- objective;
- scope;
- relevant challenge requirements;
- acceptance criteria;
- validation;
- explicit out-of-scope work.

Coding agents must follow the repository instructions defined in [`AGENTS.md`](./AGENTS.md).

---

## Setup

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npx playwright install chromium
npm run dev
```

The development server prints its local URL. Available validation and production commands:

```sh
npm run typecheck
npm run lint
npm test
npm run test:unit
npm run build
npm run preview
```

`npm test` runs bootstrap, navigation, Options, asset-loading, lifecycle, keyboard-to-player, weapons/projectiles and arena/island collision tests in desktop and mobile Chromium. `npm run test:unit` runs deterministic clock, lifecycle, immutable-configuration, randomness, input, player-motion, weapon and projectile/collision tests in Node, without a browser or server. After `npm run build`, `npm run preview` serves the production build locally. Game shows the water arena, one solid island and keyboard-controlled player with three weapons, loading/retry and minimal Start Match, Pause/Resume, End Match and Restart Match controls. Blur/hidden-tab pause requires explicit Resume. Enemies, damage application, automatic timeout/death rules, final HUD/Result and API behavior are not implemented yet.

The arena uses fixed 1280×720 logical coordinates; resizing only scales rendering. Geometry lives in `src/game/config/arena.ts`. The player uses a conservative square footprint containing its artwork at any heading. Movement stops at the first arena/island contact; rotation remains available to steer away. Collision does not cause damage. See [the collision strategy](./docs/ARCHITECTURE.md#16-task-07-arena-and-collision).

Front fire creates one cannonball; each broadside creates three parallel cannonballs. Independent cooldown defaults are **0.5s front** and **1.5s per broadside**. Projectile defaults are **400 logical units/s**, **25 damage** (not applied yet) and **2s lifetime**, giving an unobstructed range of **800 units**. Island contact, arena exit or lifetime expiration removes a projectile; end/restart/leave clears all projectiles. Pause freezes both projectile travel and cooldowns. See [weapon ownership and timing](./docs/ARCHITECTURE.md#17-task-08-weapons-and-projectiles).

---

## Controls

Start/resume/restart focuses the arena. Keyboard input is captured only while a match is running and the arena has focus; **Tab** returns to page controls. Moving focus out of the arena clears held input. Pause, focus loss, end and restart also clear input: release and press a held key again after resuming. Browser shortcuts and editable controls are not captured.

Physical letter bindings use `KeyboardEvent.code` (the W/A/D/Q/E positions on a QWERTY keyboard). Opposing left/right turns cancel; movement, rotation and attacks can be held together. Hold an attack to repeat when its weapon cooldown completes. Touch controls share these actions; landscape is the supported mobile gameplay orientation.

| Action          | Keyboard | Touch     |
| --------------- | -------- | --------- |
| Move forward    | W / ↑    | On-screen button |
| Turn left       | A / ←    | On-screen button |
| Turn right      | D / →    | On-screen button |
| Front fire      | Space    | On-screen button |
| Left broadside  | Q        | On-screen button |
| Right broadside | E        | On-screen button |
| Pause           | Esc      | On-screen button |

---

## Deployment

A public production deployment is required for the challenge.

Deployment instructions and the production URL will be added once the application reaches the deployment stage.

---

## Status

**Current phase:** Fixed-timestep simulation, lifecycle, keyboard/player movement, arena bounds, island collision and player weapons/projectiles implemented. Enemies and damage application have not started.

Current documentation:

- [x] Master Specification
- [x] Design System
- [x] Agent Instructions
- [x] Implementation Tasks
- [x] Project Bootstrap
- [ ] Gameplay
- [ ] Ranking and Match History
- [ ] E2E Tests
- [ ] Performance Validation
- [ ] Deployment

---

## Development Principle

Prefer the simplest implementation that is correct, testable, maintainable and easy to explain.

The goal is not to maximize architectural complexity.

The goal is to deliver a complete game while demonstrating clear engineering decisions.

## Mobile gameplay (TASK-12)

**Landscape is the supported mobile gameplay orientation**, evaluated against the supplied `assets/sample.png` reference, the 1280×720 arena and seven required actions. Portrait remains navigable and displays a rotate-device message; it is not the supported combat layout. Rotating or resizing does not change world geometry or combat rules.

On touch devices, hold the forward/turn buttons and any cannon buttons together. The supplied round wood-and-gold controls sit below the arena, with health, score and time above it. All touch targets are 48×48 CSS pixels. Pause uses the same latched action as Escape. Releasing one finger affects only its action ownership; cancellation, pause, end and leaving the game clear active touches. Resume requires a fresh press. Keyboard bindings remain available.

The gameplay frame respects browser safe-area insets (`viewport-fit=cover`). Browser gestures are suppressed only on action buttons; normal page interaction remains available elsewhere. The renderer fits the complete logical arena, with letterboxing when necessary, and follows viewport/DPR changes. Touch buttons select actions rather than aim at world positions, so they never convert raw device coordinates into gameplay coordinates.

Run `npm test -- --project=mobile-chromium tests/e2e/touch-responsive.spec.ts` for mobile pointer ownership, real Chromium multi-touch, cancellation, lifecycle, viewport, orientation and DPR checks.

## Mock REST API (TASK-13)

MSW starts before React in development and production. No environment variables or private service are required. The worker script in `public/mockServiceWorker.js` is copied unchanged from the installed MSW package; update it when upgrading MSW.

The API provides `GET /api/ranking` (complete configuration JSON, one-based `page`, `pageSize`), `GET /api/history` (`playerId`, `page`, `pageSize`) and `POST /api/matches` (completed match record). Page sizes are 1–100; the default is 10. Responses include items, total, totalPages, page and pageSize. Beyond the last page returns an empty items array. Empty results have zero totalPages. Ranking compares the entire GameConfig, orders score descending, then date ascending, then match ID ascending; positions are global across pages. History orders date descending, then match ID ascending. Fixtures contain 24 matches across six captains; use `captain-0` for a multi-page history with pageSize 2.

Use the browser console after the menu appears:

```js
window.pirateBattleNetwork.scenarios // All NETWORK-001–014 descriptions
window.pirateBattleNetwork.select('NETWORK-005', [100, 600, 250])
window.pirateBattleNetwork.recover() // Success again; retain confirmed records
window.pirateBattleNetwork.reset() // Reset handlers, scenario sequence, records and query cache
```

`select` accepts an optional repeating latency sequence in milliseconds. Default slow latency is 1000ms; variable latency repeats 100/600/250ms; out-of-order latency alternates 800/100ms (issue overlapping requests). Other requests have zero added latency. Axios times out at 2000ms; timeout scenarios delay 3000ms. NETWORK-013 commits before delaying the submission response. NETWORK-014 returns 503 until `recover()`, after which the same match ID can be retried. NETWORK-011 fails only Ranking, NETWORK-012 only History. NETWORK-002 removes fixtures from queries while retaining any confirmed records; reset first to reproduce completely empty lists. NETWORK-003 exposes all 24 deterministic fixtures with pagination, as does normal success.

Console probes `ranking(request)`, `history(request)` and `submit(record)` follow TanStack Query → typed API function → shared Axios → HTTP → MSW. The Ranking/History screens use the same query options; the console probes remain available for infrastructure demonstration. Scenario selection affects subsequent HTTP requests; queries retry transient failures up to twice. Configuration/page/player contexts have separate query keys. `reset()` clears cached state too. Confirmed records use `pirate-battle:mock-records:v1`; Options and last result are unaffected.

Run `npm run test:unit -- tests/unit/api-msw.spec.ts` for contracts, all 14 scenarios, ordering, cancellation, out-of-order completion, idempotency and persistence isolation. Delays are injected in unit tests; only the native Axios timeout integration checks wait for real adapter deadlines. Run `npm test -- tests/e2e/api-msw.spec.ts` for browser interception and refresh persistence in desktop/mobile Chromium. To check the production worker, run `npm run build`, serve `npm run preview -- --host 127.0.0.1 --port 4173`, and set `E2E_BASE_URL=http://127.0.0.1:4173` before running that test. On PowerShell use `$env:E2E_BASE_URL='http://127.0.0.1:4173'`.

Ranking/History screens are implemented in TASK-14. TASK-15 connects completed gameplay matches to submission and pending recovery.

## Captain’s log (TASK-14)

Ranking and Match History are accessible from the main menu and from each other. Ranking uses the currently saved Options combined with the complete default balance configuration; only equivalent configurations are compared. The server controls ordering, global rank and pagination. Ranking shows five battles per page. History currently uses the local fixture identity `captain-0` (Captain 1) and two battles per page so the four supplied captain records demonstrate pagination. TASK-15 will connect completed gameplay matches to the player identity and submission flow.

History displays date/time in UTC, points, effective duration and termination reason. Expand **Match details** for match/player IDs and the full gameplay configuration. Ranking also exposes its complete comparison configuration. All fields remain available in portrait and landscape menus; landscape remains the supported combat orientation.

Queries retain the TASK-13 policy: immediately stale, five-minute unused cache retention, refresh on return/focus and two retries for transient failures. Cached content remains visible during background refresh and refresh errors. **Retry** recovers an error; **Refresh** requests fresh data. Page changes have their own query identity and no previous-page placeholder. The same control remains mounted through retry so keyboard focus is preserved.

Run `npm test -- tests/e2e/ranking-history.spec.ts tests/e2e/navigation.spec.ts` for success, empty, server pagination, initial/background latency, cache return, error/retry, delayed page cancellation, configuration isolation, keyboard focus and responsive field coverage. Tests capture desktop/mobile reference screenshots in their Playwright output directories. Expected HTTP 503 browser resource diagnostics are distinguished from unhandled application/console errors.

## Match submission and recovery (TASK-15)

Completed timeout/death results automatically register as `captain-0` (Captain 1), using the same identity as Match History. Each completion creates one UUID, completion date and full match configuration record. That record is saved as the last result and queued before the first request. Active, manually ended and abandoned matches are never registered. Older saved summaries without an ID/configuration remain viewable without inventing a submission.

Result displays **Submitting**, **Pending** or **Confirmed** registration status. Pending registrations appear on Result and Main Menu with a separate **Retry Registration** action for each battle. You can navigate and play again while registration is pending or submitting. Refresh restores the queue and requires manual retry; it does not resume gameplay or silently resend pending matches.

The separate `pirate-battle:pending-submissions:v1` queue retains the original complete records until registration is confirmed. Retry preserves IDs and coalesces overlapping attempts for a match. The MSW endpoint independently returns the original record for an existing ID. Confirmation refreshes Ranking/History through their existing Query keys. Multiple pending battles recover independently. If device storage cannot be written, a warning explains that pending recovery cannot survive closing the page; in-memory retry and gameplay remain available.

To reproduce ambiguous recovery, select `NETWORK-013` using the console controls above and finish a battle. The mock saves it, but Axios times out and Result stays pending. Run `window.pirateBattleNetwork.recover()` and click **Retry Registration**; the existing server record confirms without duplication. For unavailability, select `NETWORK-014`, finish a battle, optionally refresh, recover the scenario and retry. `NETWORK-008` reproduces connection failure. Mock reset clears confirmed server records/query cache but intentionally leaves the client pending queue available for retry.

Run `npm run test:unit -- tests/unit/submission-recovery.spec.ts tests/unit/api-msw.spec.ts tests/unit/match-rules.spec.ts` and `npm test -- tests/e2e/submission-recovery.spec.ts` for identity, persistence, concurrent requests, cache refresh, actual completion/abandonment and recovery scenarios in desktop/mobile Chromium.
