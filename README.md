# Pirate Battle

A 2D top-down naval shooter developed for the **Jungle Gaming Frontend Game Developer Challenge**. React, strict TypeScript and PixiJS run entirely in the browser. Players navigate islands, fight Chasers and Shooters, and score one point per enemy destroyed by player attacks. The match ends at timeout or zero health.

The [original challenge](./docs/CHALLENGE.md) and supplied [assets](./assets/) are preserved. Menus, Options, gameplay/HUD/pause, Result, Ranking, Match History and pending registration recovery are implemented. **Play the [public production build](https://desafio-jungle.vercel.app)**. See [deployment evidence and procedure](./docs/DEPLOYMENT.md).

## Stack and architecture

React owns application UI; PixiJS renders the arena, ships, projectiles, health indicators and effects. Continuous gameplay stays outside React. Ranking, History and registration follow TanStack Query → typed API functions → Axios → REST → MSW. Vite builds the application, ESLint checks source, and Playwright runs Node unit tests, browser tests and visual comparisons.

Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the implemented boundaries, simulation, collisions, ownership, persistence, cache, recovery and tradeoffs. [MASTER_SPEC.md](./MASTER_SPEC.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [AGENTS.md](./AGENTS.md) contain requirements and development guidance; [docs/TASKS.md](./docs/TASKS.md) records the incremental roadmap.

## Development approach

This project was developed using a specification-driven workflow. I first decomposed the challenge requirements into explicit technical and product specifications, then implemented and validated the solution incrementally.

The repository intentionally keeps the main planning artifacts used during development:

- [`MASTER_SPEC.md`](./MASTER_SPEC.md) — requirement decomposition and acceptance criteria derived from the original challenge.
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — visual, responsive and interaction decisions based on the supplied references and assets.
- [`AGENTS.md`](./AGENTS.md) — implementation guidelines and architectural constraints used to keep development consistent.
- [`docs/TASKS.md`](./docs/TASKS.md) — incremental implementation and validation plan.

These files are intentionally included to make the reasoning, implementation process and requirement traceability behind the final solution transparent.

## Setup and runtime

Use **Node.js 22.x, at least 22.12.0**, as declared in package.json. Validation uses **Node 22.22.0 and npm 10.9.4 on Windows**; Vercel builds use Node 22.x. Dependencies are pinned by package-lock.json. Browser operation requires JavaScript, service workers (HTTPS or localhost) and browser storage for refresh durability. No environment variables, credentials or private backend are required to run the game.

From the repository root:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open the development URL printed by Vite (normally http://localhost:5173). Start a match through **Play → Start Match**. MSW initializes before React in development and production.

Build and preview in one terminal:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open http://127.0.0.1:4173. Preview serves the generated dist directory and is a local verification server, not public production hosting.

## Controls and mobile

Start/resume focuses the arena. Gameplay keys are captured only while running with arena focus. **Tab** returns to page controls. Blur/hidden tabs and leaving gameplay focus pause; resume requires explicit action. Held input is cleared on pause/end/restart/leave: release and press again after resume. Opposing turns cancel. Movement, rotation and attacks can be held together; attacks repeat at their independent cooldowns. Physical letter bindings use KeyboardEvent.code (QWERTY positions).

| Action                                 | Keyboard | Touch           |
| -------------------------------------- | -------- | --------------- |
| Forward                                | W / ↑    | Forward         |
| Turn left                              | A / ←    | Turn left       |
| Turn right                             | D / →    | Turn right      |
| Front cannon                           | Space    | Front fire      |
| Left broadside (three parallel shots)  | Q        | Left broadside  |
| Right broadside (three parallel shots) | E        | Right broadside |
| Pause                                  | Escape   | Pause           |

**Landscape is the supported mobile combat orientation.** Portrait supports menus and displays a rotate-device message. Hold multiple 48×48 CSS-pixel action buttons simultaneously; releasing/cancelling one finger clears its ownership. Buttons sit below the arena and HUD above it, respecting safe-area insets. Resize/DPR changes uniformly fit the complete 1280×720 logical world, using letterboxing without changing collision or input rules. Menus can scroll vertically.

## Gameplay configuration

Options exposes integer **Game session time: 60–180 seconds (default 120)** and **Enemy spawn time: 1–30 seconds (default 3)**. Use **Save Changes** to persist. Each start/restart copies and freezes the current configuration; changes apply to subsequent matches.

Balance lives in src/game/config/GameConfig.ts; arena geometry, enemy sizes and weapon offsets have focused configuration files. Defaults include player health 100, speed 180 units/s, front cooldown 0.5 s, broadside cooldown 1.5 s each, projectile speed 400 units/s, damage 25 and lifetime 2 s. Chaser health is 50 and Shooter health 75; distribution is 50/50. See architecture for the complete balance/tradeoffs.

Refresh or leaving combat abandons the active match without registering it. Options, last completed Result, confirmed mock records and pending submissions persist locally. A saved Result opens after refresh; use Main Menu to navigate. Storage and records are specific to the browser origin; this is a simulated leaderboard with local Captain 1 identity, not a shared online service.

## Ranking, History and registration

Ranking compares the full current configuration, orders score descending, date ascending and match ID ascending, with five rows per page. History is for captain-0 (Captain 1), shows UTC dates, duration/end reason and expandable full configuration, with two rows per page. Fixtures supply 24 records across six captains. Queries refresh on return/focus; cached rows remain during background refresh errors. Retry and Refresh are explicit controls.

Timeout/death creates a UUID and saves/queues the record before submission. Result shows Submitting, Pending or Confirmed. Retry Registration is available on Result/Main Menu; starting another match remains possible. Refresh restores pending records for manual retry. Duplicate attempts use the original ID and recover the existing server record. Active/abandoned/manual-end matches do not register. Storage failures limit durability and show warnings where applicable.

## Network scenarios and failure reproduction

These console controls exist after the UI loads in both development and production:

```js
window.pirateBattleNetwork.scenarios;
window.pirateBattleNetwork.select("NETWORK-005", [100, 600, 250]);
window.pirateBattleNetwork.recover(); // success; retain confirmed records
window.pirateBattleNetwork.reset(); // reset scenario/sequence, confirmed records and query cache
```

Selection affects subsequent requests, not already running ones. Scenarios are in-memory and return to success on refresh; confirmed records/pending submissions persist. Reset leaves Options, last Result and pending submissions intact. For a completely fresh demonstration, clear this site's storage in browser developer tools and reload (this also removes saved preferences/results).

| ID          | Behavior                                                                          |
| ----------- | --------------------------------------------------------------------------------- |
| NETWORK-001 | Success                                                                           |
| NETWORK-002 | Empty fixture lists; confirmed records remain (reset first for fully empty lists) |
| NETWORK-003 | Multiple pages of 24 fixtures                                                     |
| NETWORK-004 | 1000 ms slow responses                                                            |
| NETWORK-005 | Repeating 100/600/250 ms latency                                                  |
| NETWORK-006 | Alternating 800/100 ms for overlapping requests                                   |
| NETWORK-007 | Timeout (3000 ms response, Axios timeout 2000 ms)                                 |
| NETWORK-008 | Connection failure                                                                |
| NETWORK-009 | HTTP 400                                                                          |
| NETWORK-010 | HTTP 503                                                                          |
| NETWORK-011 | Ranking-only failure                                                              |
| NETWORK-012 | History-only failure                                                              |
| NETWORK-013 | Commit match, then timeout response                                               |
| NETWORK-014 | HTTP 503 until recovery                                                           |

The optional latency array repeats deterministically. Transient query failures retry twice; 4xx does not retry. Query keys isolate configuration/player/page and cancellation protects against obsolete responses.

**Query failure/recovery:** select NETWORK-011, open Ranking (or click Refresh if already there), wait for the error, run recover(), then click Retry/Refresh. History, Options and Play remain usable. Repeat with NETWORK-012 for History. Expected HTTP error diagnostics may appear in the browser console; unhandled application exceptions are not expected.

**Unavailable registration:** select NETWORK-014, start and finish a match through timeout/death. Result becomes Pending. Refresh if desired (the queue persists and the scenario returns to success), or run recover(), then click Retry Registration. Check Confirmed and the corresponding History/Ranking entry.

**Ambiguous timeout:** select NETWORK-013 before completing a match. The mock commits the record but Axios times out. Recover, then Retry Registration. The same ID confirms without a duplicate. Do not reset confirmed records during this check. For out-of-order responses, select NETWORK-006 and rapidly change pages or issue overlapping console probes; ordinary sequential requests do not demonstrate out-of-order completion.

The console ranking(request), history(request) and submit(record) probes use the same TanStack Query/Axios functions as UI. API contracts and persistence ownership are documented in architecture. public/apiServiceWorker.js intercepts only /api/ and imports the unchanged generated public/mockServiceWorker.js; static images/audio bypass it. Both worker files must ship in dist at the hosting root. No production environment switch disables mocks.

## Validation and visual tests

```sh
npm run typecheck
npm run lint
npm run test:unit
npm test -- --workers=2
npm run build
```

Unit tests use the Playwright runner in Node without a browser/server. npm test runs Chromium desktop/mobile E2E with an automatically started Vite server; its default port 5173 must be free. Tests cover actual movement, rotation, collision, weapons/damage/score, both enemies, match endings, pause/restart/abandonment, touch, Options, assets, lifecycle, API pagination/errors/cancellation and registration recovery. See [test coverage](./docs/TEST_COVERAGE.md).

```sh
npm test -- tests/e2e/visual-regression.spec.ts --workers=2
npm test -- tests/e2e/visual-regression.spec.ts --update-snapshots --workers=2
```

Use the second command only for intentional visual changes and manually review every changed image against supplied art. Six versioned PNGs cover Main Menu, stable gameplay and confirmed Result in desktop/mobile; mobile combat uses 740×360. Baselines were reviewed on Windows Chromium. Screenshot comparisons allow zero differing pixels with Playwright's default perceptual threshold; other rendering environments may need explicitly reviewed baselines.

HTML report: playwright-report/index.html (`npx playwright show-report`). Failures retain traces, screenshots and videos under test-results; inspect a trace with `npx playwright show-trace <trace.zip>`.

For production API/media verification, leave preview running and use a second PowerShell terminal:

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:4173'
npm test -- tests/e2e/api-msw.spec.ts tests/e2e/media-api-routing.spec.ts --workers=2
Remove-Item Env:E2E_BASE_URL
```

E2E_BASE_URL is a test-runner override, not an application variable. On POSIX shells prefix the test command with `E2E_BASE_URL=http://127.0.0.1:4173`. Production gameplay validation must use real inputs and completion; development observer tests are not a substitute for validating a public build.

The production-compatible flow verifies Options refresh, a real wall-time match, touch/keyboard, pending registration/recovery, Result refresh, Ranking/History, query failure and reset. To repeat the public checks:

```powershell
$env:E2E_BASE_URL='https://desafio-jungle.vercel.app'
npm test -- tests/e2e/production-flow.spec.ts tests/e2e/api-msw.spec.ts tests/e2e/media-api-routing.spec.ts tests/e2e/ranking-history.spec.ts --workers=2
Remove-Item Env:E2E_BASE_URL
```

## Performance and known limitations

Target: **60 FPS**, not a universal guarantee. [TASK-17 evidence](./docs/PERFORMANCE_ACCESSIBILITY.md) records an actual 180-second production match: **60.0014 mean FPS**, **17.80 ms p95 inter-frame time**, sampled entity count **2–67 (mean 35.08)**. Environment: Intel Core i7-12700H, 16,890,978,304 bytes RAM, Windows x64 10.0.26200, headless Chromium 153.0.8010.12, SwiftShader software WebGL, 1280×720/DPR 1, duration 180 s, spawn 3 s and seed 1.

Five lifecycle cycles plus ten investigation cycles checked heap/resource ownership and resolved static-asset stream retention through the API-only worker. The evidence includes precise measurements, raw JSON, reproduction commands, accessibility/responsive checks and limits. p95 measures frame intervals, not CPU work; sampled counts are not exact per-frame peaks. Physical GPUs/mobile devices, screen-reader speech and unlimited-session memory stability were not measured. Large-chunk build advisory remains. Enemies respect island collision but do not pathfind around cover; conservative square hulls favor deterministic collision simplicity.

## Deployment

The [TASK-19 final release audit](./docs/FINAL_AUDIT.md) is **READY**: all 229 MASTER_SPEC IDs, 71 original-challenge clauses and 22 Definition of Done checks pass. See the [requirement matrix](./docs/REQUIREMENT_TRACEABILITY.md) for implementation and evidence per requirement, clean-source/public validation results and documented execution limitations.

Hosting platform: **Vercel**, selected for TASK-18. Configuration builds with npm ci / npm run build and serves dist. All screens use the root URL, so no screen-route rewrite is required. HTTPS is required for the production worker. No private backend or application secrets are needed.

**Public URL: https://desafio-jungle.vercel.app**. Deployment `dpl_3ZKPAuHpeRoY2J4Ww6vvyskV5ihF` uses base commit `ac42d0149ca71d389297ed42b63c8b246240cc65` plus the TASK-18 API validation/runtime/hosting changes. No deployment commit was created. [Deployment evidence](./docs/DEPLOYMENT.md) records the exact source hash manifest and public build comparisons. Later README/evidence changes do not affect the deployed bundle.
