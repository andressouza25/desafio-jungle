# Pirate Battle — Implemented Architecture

This describes the source implemented through TASK-17. [MASTER_SPEC.md](./MASTER_SPEC.md) defines requirements; [the incremental architecture log](./docs/ARCHITECTURE.md) records historical decisions, including intermediate states that are no longer current.

## Application and rendering boundary

React owns menus, Options, Result, Ranking, History, the semantic HUD, touch buttons and the native pause dialog. `App` uses typed in-memory screen state, not URL routes. Refresh opens the saved Result when present, otherwise Main Menu; active combat is abandoned. All screens share the root URL.

`GameScreen` creates one `GameInstance` in an effect and destroys it on cleanup/retry. `GameInstance` connects the browser-independent `GameController` to input, audio and `ArenaRenderer`. Continuous positions, entities, health, cooldowns, spawning and score belong to the controller and systems. Pixi display objects copy domain state and never supply gameplay truth. The private Pixi ticker delivers raw elapsed milliseconds before rendering; there is no React animation loop.

Controller snapshots publish on lifecycle changes, health/score events and whole-second countdown changes. React does not receive every simulation frame. Feedback events carry simulation timestamps to visual/audio owners. The HUD is semantic, with no per-frame live announcements; modal pause manages focus and restores arena focus.

## Simulation, time and randomness

Lifecycle is loading → ready → running ↔ paused → ended, with terminal destruction. Assets must succeed before ready. Restart clears entities, input, weapons, elapsed time, score and health and reads a new configuration snapshot. Timeout or death creates a result; death wins if both resolve in one step. Manual end/abandonment creates no completed record.

`FixedStepClock` accumulates deliveries into 1/60-second steps, caps a delivery at 250 ms and processes at most eight steps. Excess whole-step debt is discarded while the fractional remainder remains. This bounds work after stalls; active time can lag wall time under sustained overload. Pause rebases the clock and stops ticker/audio; resume requires explicit action and a fresh delivery baseline. Timers, weapon cooldowns and spawns use simulation time, not browser timers.

Each match resets Mulberry32 with seed 1 by default. Tests can inject a clock/random source and a development-only seed input; production removes that seed branch. Wall-clock completion dates and UUIDs belong to registration, not combat rules.

## Input, collisions and combat

Keyboard and touch adapters update shared `InputState` actions. Keyboard aliases track independent held keys; touch tracks pointer ownership, allowing forward/turn/fire simultaneously. Pause is latched so a short press is consumed between steps. Blur, hidden documents, focus exit, pause, end, restart and destroy clear input. A fresh press is required after resume. Gameplay shortcuts are captured only in the focused active arena; editable controls and browser shortcuts remain usable.

The fixed 1280×720 world and island rectangles are domain configuration. Conservative square ship footprints reduce swept motion to points against expanded islands and inset arena bounds. Movement stops at earliest contact; rotation remains possible, with no collision damage from scenery. Swept projectile segments prevent tunneling, select the earliest target/obstacle/exit and resolve once. Obstacles win equal-contact ties; stable entity order resolves target ties. Projectiles expire by simulation lifetime. Destroyed enemies are removed before later steps; only destruction by player attacks earns one point, never a Chaser impact.

Chasers rotate/advance toward the player and self-destruct on impact; Shooters approach and fire within configured range/cooldown. Spawn selection uses seeded randomness, obstacle-free bounds, minimum player distance and a bounded attempt count. A failed selection skips that interval rather than accumulating retry debt. Enemies respect islands but do not implement pathfinding around them; cover can trap their approach.

## Configuration and balance

`src/game/config/GameConfig.ts` validates, copies and deeply freezes complete match snapshots. Options persists duration 60–180 seconds (default 120) and spawn interval 1–30 seconds (default 3). Changes affect subsequent starts/restarts. Geometry and weapon offsets have focused configuration files, separate from balance.

Defaults: player health 100, speed 180, rotation 2.5 rad/s; front cooldown 0.5 s and each broadside 1.5 s; projectile speed 400, damage 25, lifetime 2 s. Chaser health/speed/impact damage are 50/110/25; Shooter health/speed/range/cooldown are 75/80/400/2 s. Spawn distribution is 50/50, minimum player distance 450 and at most 32 position attempts. Speeds are logical units/s. These favor readable attacks and separated spawns; conservative collision footprints trade exact hull contact for simple deterministic rules. Ranking compares the full snapshot, preventing comparisons across different balance contexts.

## Resource ownership and mobile layout

`ArenaRenderer` owns its Pixi application, ticker callback, sprites, containers, health indicators, temporary effects, resize observer, density listener and scheduled resize frame. Texture loading shares an in-flight request/cache across mounts; instance teardown preserves shared texture sources while releasing frame wrappers. Async initialization finishing after unmount is destroyed before attachment. Retry releases the old owner first. Cleanup is idempotent under Strict Mode.

`GameInstance` owns keyboard/touch, visibility/blur/focus/gesture listeners, controller subscriptions and `GameAudio`. Audio unlocks after a trusted gesture; voices/loops stop on pause/end/destroy. Visual effects use simulation timestamps and ship deterioration follows health. One running match has one simulation delivery callback.

Canvas fitting uses equal scale axes, letterboxing and device pixel ratio without changing world rules. Resize work is coalesced outside observer delivery. Landscape is supported for touch combat; portrait menus remain navigable with a rotate-device message. Seven 48×48 CSS-pixel actions sit below the arena, HUD above it, with safe-area insets. Touch selects actions, so no screen-to-world aiming conversion is needed.

## API contracts and server state

React → TanStack Query → typed API functions → shared Axios → HTTP → MSW is the Ranking/History/registration boundary. Axios has a 2000 ms timeout and query cancellation uses AbortSignal. Contracts in `src/api/contracts.ts` validate received records/configuration.

| Resource | Contract |
| --- | --- |
| GET `/api/ranking` | Complete configuration JSON, one-based page and pageSize; returns MatchRecord plus global rank |
| GET `/api/history` | playerId, page, pageSize; returns MatchRecord items |
| POST `/api/matches` | MatchRecord: match/player IDs, name, ISO date, score, effective duration, timeout/death reason and full GameConfig |

Pages include items, total, totalPages, page and pageSize; sizes are 1–100. Ranking orders score descending, date ascending, then ID ascending within equivalent configurations. History orders date descending then ID ascending. The local identity is `captain-0` / Captain 1. Screens use five Ranking rows and two History rows per page.

TanStack Query owns cache, loading/error/empty/background refresh and mutation state. Queries are immediately stale, retain unused cache five minutes, refresh on return/focus and retry transient failures twice (not cancellation/4xx). Configuration/page/player contexts have distinct keys and cancellation prevents obsolete requests overwriting current context. Successful registration invalidates Ranking and History. Cached rows remain during background errors; page changes do not reuse previous-page placeholders.

MSW starts before React in development and production. Shared handlers/fixtures/scenario logic power browser and Node tests. `apiServiceWorker.js` filters fetches to `/api/` before importing the unchanged generated `mockServiceWorker.js`; static media bypass interception. There is no private backend. Confirmed mock records persist locally, with 24 deterministic fixture matches across six captains.

## Persistence, idempotency and recovery

Storage adapters isolate Options, last completed result, confirmed mock records and pending submissions in browser localStorage. Active gameplay and query cache are not persisted. Storage is origin-local and cannot provide a shared public leaderboard or authentication. Blocked/quota-exhausted storage cannot guarantee refresh durability; the UI reports persistence failure where implemented.

Completion creates one UUID/date/configuration record, enqueues it durably before the request and saves the last result. App-lifetime `SubmissionRecovery` survives screen navigation; in-flight attempts are deduplicated per match ID. TanStack Query performs the mutation with automatic mutation retry disabled. The mock database returns an existing record for the same match ID; ambiguous post-commit timeouts therefore retry without duplication. Failures remain Pending after refresh and have explicit Retry Registration actions. New gameplay is independent of queued registrations. Recover changes the network scenario without deleting records; reset restores fixtures and clears confirmed records/query cache but does not erase Options, last result or the pending queue.

## Tests, evidence and limitations

Node unit tests exercise clocks, configuration, input, collisions, enemies, combat, contracts, persistence and idempotency. Browser tests use isolated contexts/storage, deterministic seed/time controls, real keyboard/touch → simulation → observable behavior, desktop/mobile Chromium, cancellation/recovery and versioned screenshots for Menu, gameplay and Result. Test observation does not make Pixi the source of simulation truth.

[TASK-17 evidence](./docs/PERFORMANCE_ACCESSIBILITY.md) reports 60.0014 mean FPS, 17.80 ms p95 inter-frame interval and sampled entities 2–67 during a real 180-second match. Its Windows/i7-12700H/16,890,978,304-byte RAM environment used headless Chromium 153.0.8010.12 and SwiftShader at 1280×720/DPR 1. Fifteen lifecycle cycles investigated MSW response-stream retention; the API-only worker removed observed native stream growth. These finite measurements do not guarantee universal 60 FPS, physical GPU memory stability, physical mobile compatibility or full WCAG certification. The build has a large-chunk advisory. Supplied art remains the visual foundation; no physics/pathfinding/router dependencies were introduced.

Public hosting and exact deployment traceability are recorded in [deployment evidence](./docs/DEPLOYMENT.md). TASK-18 production validation opens the actual public build and exercises real gameplay/MSW flows. The API list boundary rejects malformed JSON/HTML fallback responses before they can crash React, preserving the existing Query error/retry flow.
