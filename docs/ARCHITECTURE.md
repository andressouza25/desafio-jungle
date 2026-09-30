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

## 13. TASK-04 Rendering Foundation

`GameScreen` attaches an `ArenaRenderer` in an effect and destroys it on cleanup or loading retry. React receives only loading progress, ready and error states; the renderer owns its Pixi application, display objects, host ResizeObserver and DPR media-query listener. Observer-triggered resize writes are coalesced into one cancellable animation-frame callback, outside observer delivery; the canvas host is positioned independently of canvas intrinsic size. An asynchronous initialization that completes after unmount is destroyed without attaching a canvas. The private ticker remains stopped for this static scene: rendering happens on initialization and resize, with no simulation or gameplay loop yet.

The foundation uses a 1280×720 logical arena, uniformly fitted and centered inside the available canvas without changing logical dimensions on resize. Renderer resolution follows device pixel ratio, including changes while mounted. These coordinates are a rendering baseline, not collision geometry or a final arena layout. The minimal typed manifest contains only the supplied retina water tile (`assets/png/retina/tiles/tile_73.png`, resolution 2). One shared in-flight request and one app-lifetime cached texture serve remounts; a failed request can be retried. Unmount removes loading subscriptions and destroys instance resources while preserving that shared texture for reuse. No additional assets or domain state are introduced.

## 14. TASK-05 Simulation and Lifecycle Foundation

`GameController` is the browser-independent owner of `loading`, `ready`, `running`, `paused` and `ended`. It exposes start, pause, resume, end, restart, abandonment and idempotent destruction. Only successful renderer initialization makes the controller ready. Destruction is terminal (a separate `destroyed` flag), and active destruction marks abandonment without recording a result. End and restart are explicit foundation operations; automatic timeout/death rules and result handling belong to later tasks.

The injectable `SimulationClock` defaults to `FixedStepClock`: elapsed millisecond deliveries enter an accumulator, which advances simulation time in **1/60-second** steps. A delivery is capped at **250 ms**, with at most **8 steps** processed; excess whole-step debt is dropped, retaining only the fractional remainder. This prioritizes bounded work after stalls over catching up to wall time. Negative/non-finite deliveries are ignored. Start/restart reset elapsed simulation time. Pause and resume clear the partial step and discard the next delivery, including a stale paused/hidden interval. This may discard less than one step of active time at a pause boundary; rendering frames are never counted as game time.

`GameInstance` owns the browser integration and the existing `ArenaRenderer`. Exactly one elapsed-delivery callback is attached to its private Pixi ticker, before the render callback; it forwards raw, unscaled `elapsedMS`, not Pixi `deltaTime` or capped `deltaMS`. The ticker runs only in `running`. On start/restart/resume, the integration stops the ticker, establishes a zero clock delivery baseline, and starts the ticker with a fresh wall-time baseline. This prevents old time from entering the simulation while preserving the first active interval, including an in-place restart. Visibility loss and window blur pause the controller, while focus/visibility restoration never automatically resumes it. Start, restart and resume require a visible, focused document. Teardown removes the visibility/blur listeners, subscriptions, delivery callback, pending resize work and renderer resources. No second simulation loop is created.

`GameConfig` centralizes typed balance defaults and the existing Options limits/defaults; storage continues to own persistence and re-exports the Options API. Start/restart read current Options through the React integration, then copy and deeply freeze the configuration. The initial movement/combat balance numbers are inactive defaults for later systems, not new implemented mechanics; units are logical units/second, radians/second and seconds. Each match also creates a fresh injectable `RandomSource`, using Mulberry32 and default seed **1**, with no ambient randomness or wall clock in the simulation core. Restart resets the same seed for reproducibility.

React stores only lifecycle and loading states. Controller subscribers receive an immutable snapshot on subscription and lifecycle transitions, never on each fixed step; callers can read current simulation time through `getSnapshot()` without publishing it to React. The foundation screen exposes simple lifecycle controls, not final pause UI, HUD, Result content or gameplay controls. Unit tests run in Node with the installed Playwright runner (`npm run test:unit`), with no browser/server dependency. Browser tests observe real Pixi ticks and React commits through their existing devtools hooks and exercise lifecycle controls with controlled time.

## 15. TASK-06 Player and Keyboard Input

`InputState` stores typed gameplay actions independent of physical controls. `KeyboardActions` translates documented key codes and tracks aliases, so releasing W while ↑ remains held does not release forward movement. It ignores repeats after clearing input; resuming requires a fresh key press. `KeyboardInput` owns two window listeners and one arena focus-out listener. It captures only mapped keys while running, with a visible/focused document and an event target inside the focused arena; editable controls, native buttons and browser shortcuts retain normal behavior. Browser handlers translate actions only. Input latches the pause request until the controller consumes it before advancing simulation, so a quick press/release between steps is not lost; clearing input also cancels that request. The lifecycle subscription activates/deactivates input and clears held physical keys. Leaving arena focus, pausing, blur/visibility loss, ending, restart and destruction clear actions; teardown explicitly removes every owned listener. Touch adapters are not implemented.

`GameController` owns the player, created at arena center with heading zero (up) and snapshotted health. Logical arena dimensions live in domain configuration, not in the renderer. `FixedStepClock.advance` now delivers a **1/60-second callback for each processed step**; `movePlayer` consumes action state and snapshotted movement/rotation speeds at those steps. Turns are clockwise-positive radians normalized to [0, 2π); opposing turns cancel, and rotation is applied before forward translation. There is no acceleration, collision, boundary constraint or damage rule yet. Restart creates a new player. `getPlayerState()` returns an immutable read, separately from React-facing lifecycle snapshots; movement never publishes a UI event.

The existing ticker callback advances the controller and then synchronizes the player sprite before Pixi renders. `ArenaRenderer` owns the sprite, whose transform is copied from simulation state, never read back into it. It uses supplied `assets/png/default/ships/ship_2.png`, centered anchor and a π artwork offset because the source bow points down. Default and retina ship files have identical hashes and dimensions (**66×113**), so the texture uses resolution **1**, not an assumed 2× variant. The manifest contains only water and player, with shared in-flight loading, combined progress, cached textures and visible retry for either failure. Both requests settle before retry; successful textures stay in Pixi's asset cache. Instance teardown destroys display objects without destroying shared textures. No additional ticker or dependency is introduced.

Keyboard mappings and current limitations are documented in README and semantic control instructions. Start/resume/restart focuses the arena; a visible focus outline identifies that context. Node tests verify actions, aliases, seeded lifecycle preservation and identical movement at 10–144 Hz. Browser tests drive real keyboard events through simulation to rendered transforms, check held-key transitions, five remounts, both asset retry paths and React commits while moving, in desktop/mobile Chromium. Mobile keyboard coverage is not touch-control implementation.

## 16. TASK-07 Arena and Collision

`game/config/arena.ts` owns deeply immutable world geometry: the existing **1280×720** bounds and one **192×192** island at **(256, 224)**. Neither viewport size nor PixiJS bounds participate in collision queries. The player has a rotation-independent axis-aligned square with half-size **66** logical units, the ceiling of the supplied 66×113 artwork's half-diagonal. This deliberately conservative footprint contains the complete ship at every heading; rectangular island corners also conservatively cover the rounded shoreline. These shapes may stop the artwork slightly before visible contact, rather than allowing penetration.

The TASK-06 pipeline remains action-based and rotation-first. On each fixed step, `movePlayer` proposes a transform, resolves translation, then commits the final position and rotation. `systems/collision.ts` exposes pure point containment, rectangle expansion, segment/rectangle sweep and arena movement resolution. A square body is resolved by sweeping its center against expanded islands and inset arena bounds. The earliest contact stops translation, without sliding, bouncing or damage; turning and moving away remain possible. The sweep considers the complete segment, preventing tunneling even if an endpoint lies beyond an obstacle. A **1e-7 logical-unit** island separation handles floating-point contact roundoff, not gameplay balance. Queries require a valid starting position; match initialization remains at the clear arena center. No physics dependency or additional loop is introduced, and the fixed clock's frame-gap limits are unchanged.

Rendering consumes that domain layout in one direction. The small manifest adds the supplied **1×** `assets/tilesheet/tiles_sheet.png`; only its grass/sand island frame at **(320, 0, 256, 256)** is used. This is an inspected artwork crop, not inferred collision geometry or a catalog of future assets. The atlas shares the existing loading cache, progress and retry path. Each renderer owns its frame texture wrapper and island sprite; teardown destroys the wrapper without destroying the shared atlas source. Resize/DPR handling only transforms the rendered world, never entity or obstacle coordinates. PixiJS continues to copy resolved player state; React receives no per-step collision updates.

Unit coverage includes every edge, diagonal/corner approaches, all island sides, tangent/contact escape, obstacle ordering, configured high-speed sweeps, frame gaps, simultaneous turning and deterministic updates. Browser coverage uses real keyboard input to reach every edge and island side, checks resolved rendered positions, repeated lifecycle cleanup and desktop/mobile resizing, and confirms that deliberately changing a display-only island transform cannot change collision rules. Projectile/enemy integration and final arena composition are deferred to their assigned tasks.

## 17. TASK-08 Weapons and Projectiles

`GameController` owns projectile entities and weapon readiness. Each fixed step resolves player movement, advances existing projectiles and fires held attack actions from the resolved player transform at that step's end. Newborn projectiles advance on the next step. Front fire creates one projectile; each broadside creates three parallel projectiles and starts exactly one independent cooldown. Readiness uses absolute simulation seconds, with a **1e-9-second** numerical boundary tolerance, never browser timers or rendering frame counts. Pause freezes travel and readiness; restart resets all entities, IDs and cooldowns against a fresh immutable configuration snapshot.

`game/config/weapons.ts` owns immutable ship-relative origins: the front is **60** units forward, and each broadside has longitudinal offsets **−24, 0, 24** at **38** units port/starboard. These offsets derive from the supplied 66×113 ship artwork, independently of sprite transforms. Projectile entities own position, unit direction, copied speed/damage and remaining lifetime; unobstructed range is speed × lifetime. Damage is stored only, not applied. The fixed-step systems import no browser, React or PixiJS APIs.

Projectiles use a conservative **5-unit half-size square**, matching the supplied 10×10 cannonball. They reuse rectangle expansion and segment sweeps from TASK-07, with inclusive endpoint contact for projectiles and unchanged player semantics. Sweeps resolve the earliest island contact or arena exit, limited to remaining lifetime. A terminal resolution flag prevents an entity from resolving or updating twice; removed entities leave the active collection immediately. End, restart and destruction clear outstanding entities. No enemy collision, damage, scoring or physics engine is introduced.

The small asset manifest adds only `assets/png/default/ship_parts/cannon_ball.png` at resolution **1** (default/retina files are identical). It is explicitly emitted as an external Vite asset so production retains the shared loading/progress/failure/retry behavior. `ArenaRenderer.syncState` copies immutable simulation reads into an ID-keyed map of sprites. Removal detaches and destroys the sprite without destroying the cached texture; instance teardown destroys all remaining display objects. There is still one ticker, and React receives no per-frame player or projectile data. Firing effects/audio and final visual polish remain deferred.

## 18. TASK-09 Enemies and Spawning

The controller owns Chaser/Shooter transforms, health, terminal destruction flags and simulation-time attack deadlines. AI turns toward the player at configured angular speed and moves forward through the existing arena sweep. Shooters stop approaching inside attack range and aim cannonballs at the player. Chaser contact destroys the entity before applying its single impact. No scoring, HUD, effects or automatic match-end rules are introduced here.

The shared projectile system sweeps against living opposing targets as well as islands and bounds. The earliest terminal contact wins, with obstacles winning equal-distance ties and stable enemy order breaking target ties. Damage resolves through the existing terminal gate; destroyed enemies are excluded immediately, before AI and further projectile processing. Both sides share projectile configuration and the match's projectile ID sequence. New projectiles and enemies begin updating on the following step.

Spawning consumes the injected seeded source and immutable configuration. Each interval selects a weighted enemy type, then tries at most the configured number of uniformly sampled positions within inset arena bounds. Invalid positions are rejected against expanded islands and player distance. Defaults are 450 logical units of minimum player distance and 32 attempts; a failed selection skips that interval rather than accumulating retries. The default distance exceeds Shooter range and ship contact size. Simple pursuit can remain blocked against an island; pathfinding is deliberately outside this task.

Enemy sprites use supplied `ship_3.png` (Chaser) and `ship_1.png` (Shooter), each 66×113, with the same conservative 66-unit square footprint as the player. Enemy cannonballs reuse the supplied cannonball texture. Shared textures remain cached; renderer-owned sprites are created/removed by simulation identity and destroyed without destroying shared textures. React receives no enemy state or per-step notifications. End, restart, abandonment and destruction clear simulation entities and corresponding display objects.

## 19. TASK-10 Match Rules, HUD and Last Result

Enemy destruction records a typed source (`player-attack`, `contact` or `other`). The controller counts player-caused destruction before removing terminal enemies; removed entities cannot be counted again. Contact destruction never scores.

The fixed-step clock callback may return `false` to stop the current delivery immediately. After combat resolution, zero player health takes priority over timeout in the same step. Termination clears input, projectiles and enemies once, freezes one final result, and blocks subsequent updates. Timeout duration is bounded by the configured duration; death duration uses active simulation time. Abandonment/manual development termination do not create completed results.

React snapshots publish lifecycle transitions, changed health/score, and changed whole seconds remaining, without continuous transforms. `GameInstance` applies ticker/input/focus transitions only when lifecycle changes, so HUD notifications cannot rebase the loop or steal keyboard focus. Pixi health indicators use supplied HUD artwork and atlas fill rectangles, track simulation health, and release entity-owned texture wrappers while preserving shared sources.

The storage boundary validates and persists only the last completed score, effective duration and reason. A valid saved result opens Result after refresh. Play Again mounts a fresh game instance and starts after assets are ready; Main Menu leaves the saved result intact. Storage failure is reported on Result without blocking another match. Remote registration and recovery remain assigned to later tasks.

## 20. TASK-11 Pause and Feedback

Manual pause still enters through the shared action store and the controller lifecycle. Document visibility and window blur pause immediately; leaving the Game screen's focus context also pauses. Moving between controls within the Game screen clears held arena input without capturing normal button navigation. Returning focus/visibility never resumes. The native React pause dialog makes background controls inert, contains keyboard navigation and initially focuses Resume. Resume closes the modal before the controller focuses the arena; a rejected hidden/unfocused resume reopens the dialog.

The controller publishes immutable, typed presentation events after existing systems resolve firing, projectile contact, damage and destruction. Combat rules and score resolution remain simulation-owned. Feedback subscribers cannot write through event payloads. React's semantic HUD publication cadence is unchanged.

The renderer preloads the supplied miscellaneous atlas and shares its inspected effect frame textures across instances. One owned feedback layer renders brief firing/contact/damage flashes, destruction explosions and health-dependent fire. Temporary effects expire against simulation time, freeze on pause and are capped at 48. Restart, end and teardown clear effects; cached textures remain shared.

Each Game instance owns its audio adapter. Trusted pointer/keyboard gestures unlock playback; denied playback is caught and later gestures can retry ambience. Six total one-shot voices and two per sound bound overlap. Two quiet ambience/sailing loops have explicit ownership. Pause stops combat audio/loops and plays the pause cue; resume recreates loops and plays its cue. Semantic snapshots trigger score, low-health and final-time warnings once per match, plus start/end cues. End/destroy release loops and voices. Audio never controls simulation time, damage or scoring. All gesture/focus listeners and feedback subscriptions are removed during teardown. No new dependency is required.

## 21. TASK-12 Mobile Input and Responsive Gameplay

Landscape is the supported mobile combat orientation, based on the supplied landscape gameplay reference, the fixed 16:9 logical arena and the six held actions plus pause. Portrait keeps navigation and the complete arena visible with a rotate-device message; there are no mobile-specific gameplay rules. The existing HUD stays above the arena and a compact touch-control strip stays below it, avoiding gameplay obstruction. CSS safe-area insets apply to the gameplay frame and viewport-fit enables them. Supplied button/icon PNGs preserve the wood, gold and navy visual language; each target is 48×48 CSS pixels.

`GameInstance` owns `TouchInput` alongside `KeyboardInput`. Pointer Events identify explicit pointer owners and capture trusted contacts until up, cancel or lost capture. Both adapters contribute owner identifiers to the existing `InputState`; an action remains held until its last owner releases it. Keyboard focus clearing removes keyboard owners only. Pause commands are latched per owner so rapid taps survive until simulation delivery, and keyboard interruption can cancel keyboard commands without affecting touch commands. Lifecycle transitions reset both physical adapters and the controller input, including restart, automatic pause/end and destruction. No pointer handler moves ships or fires weapons.

Controls are semantic labeled buttons selected by action, not coordinates in the arena. Layout hit testing follows the browser's current viewport; no CSS/device coordinate becomes a domain position. The existing renderer retains uniform logical-world fitting and DPR handling, with window/visual-viewport resize listeners as well as the host observer and density media query. All additional listeners are instance-owned and removed on destruction. React receives existing coarse HUD/lifecycle snapshots rather than pointer or simulation-frame state.

TASK-12 validation: typecheck, lint and production build passed; 61 unit tests passed. Mobile Chromium verified all seven actions (including real multi-touch and pause taps), independent pointer ownership/release/cancel/lost capture, pause/end/blur/hidden cleanup, automatic match completion and teardown/remount. Responsive checks covered 568×320, 740×360, 932×430 and portrait 390×844 transitions, 48px labeled targets, unobstructed arena, compact pause dialog, DPR change and real pointer hit testing after resize, and nonzero safe-area overrides (12/24/16/24px). Browser error/console checks were clean. Desktop keyboard/pause regressions passed, and the updated renderer ownership test passed five mount cycles in both desktop and mobile Chromium, retaining zero resources after teardown. Validation used Windows Chromium emulation; physical-device testing was not performed. The build still reports the existing large-chunk advisory.

## 22. TASK-13 Mock REST and Remote State

`api/contracts.ts` shares immutable match records with full GameConfig snapshots, independently of mutable simulation state. Ranking equivalence uses a canonical serialization of every known configuration field. Typed API functions share one Axios client with a 2000ms transport timeout and forward TanStack Query AbortSignals. Query options key every configuration, player and pagination dimension; replacing a same-key request requires cancellation, which aborts Axios and prevents an obsolete result updating the cache. Queries are immediately stale, refresh on mount/focus and retry transient failures twice with bounded backoff; 4xx and cancellation do not retry. Submission mutations invalidate both resource families; gameplay integration is deferred.

`mocks` owns fixtures, scenarios and backend state independently of Query cache. Handlers validate incoming records/configurations, paginate consistently, and identify submissions by globally unique match ID. An existing ID returns its original record (another player's reuse returns 409). Browser storage persists confirmed records; unsuccessful storage writes are not acknowledged. Reset increments a backend generation so delayed submissions cannot repopulate reset persistence. Scenario selection captures behavior per request; delays use explicit repeating sequences, with an injectable wait function for tests. NETWORK-013 registers before the timeout; NETWORK-014 requires explicit recovery. Pending client submissions remain outside this task.

MSW starts before application mounting in both builds, using the installed package's unchanged worker. A console-only `pirateBattleNetwork` control offers select/recover/reset and Query-backed probes without adding feature UI. Node tests create isolated backend storage and reset handlers/scenarios/database between cases. Production browser tests verified actual worker interception, Query/Axios requests, durable registration after refresh, and clean consoles in desktop/mobile Chromium. No dependency was added.

## 23. TASK-14 Ranking and Match History

`api/useMatchQueries.ts` provides typed observer hooks over the existing TASK-13 query options. No contract, Axios client, query-key or mock change was required. Keys include the complete canonical ranking configuration or history player ID, plus page and page size. The hooks forward cancellation through the established query functions. There is no response copy in React state, client sorting or client pagination.

`CaptainsLog.tsx` owns only requested pages and an immutable ranking configuration derived from saved Options at screen entry. The shared log frame reads pagination metadata, separates initial loading from background fetching, preserves cached content after refresh failures, and provides explicit retry. No previous-page placeholder is used. A return remount immediately serves cache while refetching under the established staleTime/refetchOnMount policy. Ranking pages contain five entries; history pages contain two entries for the four-match local fixture captain. Local identity is `captain-0`; submission integration remains TASK-15.

The supplied panel/button/round-control assets and existing palette/typeface define the composition. Four-column semantic tables become labeled stacked rows below 768px without removing required data. Native disclosure controls expose IDs and all configuration values without widening the primary history columns. UTC dates include year/time, effective duration retains seconds, and server rank is displayed unchanged. Pagination uses 48px labeled round controls and a polite page status; background refresh has a visual message without live announcements. Refresh/retry shares a persistent button to retain focus.

## 24. TASK-15 Submission and Recovery

The Game screen converts the immutable completed simulation result into a complete `MatchRecord` once, retaining it by result identity in a ref. The UUID and wall-clock completion date belong to this application boundary; simulation clocks and combat remain unchanged. The record includes the actual match configuration snapshot and the shared local captain identity. Only a completed timeout/death result reaches this boundary. Last-result parsing preserves full records while remaining compatible with legacy score/time/reason summaries, which are never automatically submitted.

One app-lifetime `SubmissionRecovery` owner survives screen navigation. It stores complete pending records behind `storage/pendingSubmissions.ts`, separate from last-result and mock-server storage. Enqueue validates and deduplicates records and attempts durable persistence before sending. A per-ID promise map coalesces concurrent attempts, including reentrant notifications. TanStack Query mutations call the shared typed API/Axios layer; registration responses are validated before the existing mutation success handler invalidates both Ranking and History key families. No server list is copied into React state.

The queue retains each record during requests, failures and ambiguous timeouts. Only validated confirmation removes that ID; other matches remain untouched. Refresh restores pending records as manually retryable, with no automatic retry loop or background worker synchronization. UI subscribers receive changes through `useSyncExternalStore`, not gameplay frames. Pending state is visible on Result and Main Menu, while Play Again and navigation remain available. Failed storage writes are surfaced without blocking gameplay or in-memory retry. After successful removal, an absent queue entry for a complete saved result represents confirmed registration; failed removal persistence safely leaves the record retryable after reload.

The existing MSW database is the independent idempotency boundary: its synchronous registration checks the ID and stores at most one record, returning the original record on duplicate attempts. NETWORK-013 commits before delaying its response beyond Axios's timeout, so a client-side pending record can already exist on the server. Retrying the same complete record resolves that ambiguity and refreshes both lists. NETWORK-014 and connection failures preserve the same queue until explicit recovery. Tests cover raw concurrent HTTP attempts as well as client-side coalescing and real gameplay completion across refresh in desktop/mobile Chromium. No dependency was added.

## 25. TASK-16 Deterministic Browser Coverage

E2E helpers inject read-only observations of existing React/Pixi owners before loading the application. They expose no application API for writing entities, health, projectiles or score. Browser clock control drives the real ticker; terminal-flow helpers advance only the existing production simulation clock in bounded steps. Keyboard and touch continue through shared input, simulation systems and rendered/HUD consequences.

`GameInstance` accepts the validated uint32 `__pirateBattleTestSeed` only behind `import.meta.env.DEV`. This narrow pre-construction environment input passes to the existing seeded `GameController`; the production build removes the branch and key. Seed 1 covers standard combat/restart/screenshots; seed 7 isolates observable Chaser pursuit/contact without changing distribution or balance. Each Playwright context has separate storage, worker, Query client, scenario, mock records and match owners. Fixed browser dates are later than the supplied History fixtures so actual registration is visibly newest.

The E2E audit exposed a native mobile Pause activation bug. `TouchInput` now handles keyboard/assistive clicks (`detail === 0`) by feeding the same latched pause action. Pointer activation keeps its existing ownership path, and teardown removes the new listener. No continuous React state or gameplay rule changed.

Visual assertions compare six manually reviewed baselines with fixed viewports/locale/timezone and paused seeded gameplay. No differing pixels are allowed under Playwright's default perceptual color threshold. Failure-only screenshots, videos and traces accompany the HTML report, with zero test retries. The coverage map and validation evidence live in `docs/TEST_COVERAGE.md`.

Vite's development watcher excludes generated Playwright reports, test results and temporary diagnostics. This prevents trace HTML created by one worker from triggering a page reload in another worker. Application-source watching is unchanged.

## 26. TASK-17 Measured Resources and Accessibility

Production profiling and fifteen uniform lifecycle cycles are documented in [PERFORMANCE_ACCESSIBILITY.md](./PERFORMANCE_ACCESSIBILITY.md). The measured static-asset retention came from MSW response stream transfers, while game-owned resources were released. A small `apiServiceWorker.js` entry filters non-API fetch events before importing the unchanged generated MSW worker. REST mocks, Axios/Query ownership and gameplay are unchanged; local media/images use normal browser loading.

External Playwright scripts observe the existing controller/application without adding a production debug interface or controlling simulation time. Frame intervals, entity samples, GC-separated lifecycle metrics and accessibility/contrast evidence are saved separately from regression reports. Contrast corrections use the existing Ranking text token and keep mobile HUD/navigation text inside the dark sprite interiors, with footer navigation on narrow landscape screens. HUD publication remains event/whole-second driven. No dependency, simulation optimization or architecture rewrite was introduced.
