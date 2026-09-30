# TASK-17 — Performance and Accessibility Evidence

Measured on September 30, 2026. Targets and observations below are deliberately separate. Machine-readable observations are in [the evidence directory](./evidence/); scripts preserve detailed intervals, screenshots and heap snapshots under `output/playwright/`.

## Reference environment

| Item | Measured environment |
| --- | --- |
| CPU | Intel Core i7-12700H, 20 logical processors |
| RAM | 16,890,978,304 bytes (about 15.73 GiB) |
| OS | Windows x64, build 10.0.26200 |
| Browser | Playwright Chromium 153.0.8010.12, headless |
| Renderer | WebGL through ANGLE/Vulkan SwiftShader (software rendering) |
| Viewport | 1280 × 720 CSS pixels, DPR 1 |
| World | Unchanged 1280 × 720 logical arena, supplied island |
| Build | Optimized Vite production build, served by Vite preview on localhost:4173 |
| Match | 180 seconds, spawns every 3 seconds, seed 1 (production default) |
| Balance | Default health, movement, weapons, projectiles, enemy distribution and collision rules; full snapshot in the evidence JSON |
| Other conditions | Fresh browser context/storage, normal MSW success scenario, real wall time, audio and visual feedback enabled; no other browser test suite ran during the final three-minute capture |

The physical GPU could not be queried through the sandbox. SwiftShader is the actual renderer used, so these are not hardware-GPU measurements. Browser refresh scheduling in headless mode is also part of this environment.

## Three-minute procedure and results

`scripts/profile-production.mjs` uses Playwright keyboard input through the existing input system. It saves 180 seconds through Options, starts a real match, holds all three weapons and navigates around the island before using its cover. Enemies continue to spawn, approach, collide, shoot and render; projectile/impact effects and audio remain enabled. This produces an entity-heavy match with island obstruction, rather than reducing the spawn workload. The final run ended through the real timeout rule, with health 100 and score 0. No entity, clock, health, weapon or configuration mutation is injected into the simulation.

One observation callback reads `performance.now()` from the existing application ticker. FPS is interval count divided by the total measured interval duration. p95 is the nearest-rank 95th percentile of **time between ticker frames**, not CPU execution time. Entity totals are sampled about once per active second and include the player, enemies and active projectiles; static scenery, health bars and temporary effect sprites are excluded. Sampled peaks are not asserted to be exact per-frame peaks. Navigation observes a small player/snapshot record about ten times per second; this instrumentation has overhead and was kept outside production application code.

| Measurement | Before final resource fix (audio-only bypass) | After API-only worker fix |
| --- | ---: | ---: |
| Active duration | 180 s | 180 s |
| Mean FPS | 60.0016 | 60.0014 |
| p95 inter-frame time | 17.80 ms | 17.80 ms |
| Recorded intervals | See raw local evidence | 10,800 |
| Largest recorded interval | See raw local evidence | 21.30 ms |
| Approximately one-second FPS windows | See raw local evidence | 59.898–60.146 |
| Sampled entity total | See raw local evidence | 2–67, mean 35.08 |
| Sampled enemy peak | See raw local evidence | 59 |
| Sampled projectile peak | See raw local evidence | 9 |
| Unexpected runtime/console errors | 0 | 0 |

The **target** remains 60 FPS. The measured mean and one-second windows are close to that target; p95 is above the ideal 16.67 ms frame interval. This does not guarantee every frame completes within 16.67 ms or that other devices/play strategies achieve 60 FPS. No render/simulation hot-path rewrite, pooling, gameplay reduction or speculative optimization was justified by these observations.

Earlier open-water navigation attempts ended by legitimate player death at 14.3, 31.7, 34.4 and 18.5 seconds. They were discarded as three-minute evidence, rather than presented as successful profiles.

## Lifecycle procedure and investigation

After the profile, repeat the same procedure: Play → Start Match → hold forward/front fire for five real seconds → release keys → Escape → Main Menu → wait one second. Capture CDP performance metrics after explicit GC, plus read-only inspection of the current destroyed game owner. The probe retains at most one destroyed instance/application for observation; it does not retain a list of previous game owners. GC is used between cycles, never during the three-minute FPS profile.

### First five cycles after the fix

| Cycle | JS heap used (bytes, after GC) | DOM nodes | Global event listeners | Documents | Active game resources |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 7,040,220 | 171 | 212 | 2 | Zero |
| 2 | 7,156,832 | 171 | 212 | 2 | Zero |
| 3 | 7,181,524 | 171 | 212 | 2 | Zero |
| 4 | 7,288,688 | 171 | 212 | 2 | Zero |
| 5 | 7,294,428 | 171 | 212 | 2 | Zero |

“Zero” covers canvases, renderer application, enemies, projectiles, health indicators, temporary feedback owner, resize observer, active audio voices/loops and simulation/feedback subscriptions. The game instance is destroyed. Global browser/React/MSW listeners are expected to remain; their constant count is not a claim that the whole page has zero listeners. Existing lifecycle/input tests additionally verify ticker ownership, keyboard listeners, pointer cancellation, visibility/focus cleanup, DPR/resize listeners and Strict Mode remount behavior.

Initial measurements showed monotonically increasing heap despite zero game-owned resources. Investigation extended the run to fifteen cycles and compared heap snapshots. Before the resource fix, fifteen cycles added **205 native ReadableStream objects**, 429 MessageEvents and 634 MessagePorts; retained URL strings included 200 copies of cannon-fire URLs. Bypassing only audio removed the repeated cannon streams but left streams associated with menu image reloads. This confirmed that MSW's static-asset response-body transfers, rather than a second game loop or surviving audio owner, contributed to retention.

`public/apiServiceWorker.js` now installs a small fetch filter before importing the unchanged generated `mockServiceWorker.js`. Only `/api/` requests reach MSW; local image/audio requests use the browser's normal loading path. Axios → TanStack Query → REST → MSW remains intact. The browser regression explicitly checks real cannon audio and images bypass the worker while Ranking responses are still intercepted.

After the final fix, **fifteen** cycles added **zero native ReadableStream objects**. The largest snapshot increases were V8 compiled instruction streams (537,536 bytes), compiled byte arrays (109,380 bytes), feedback vectors (67,716 bytes), and browser performance/layout timing records. There were only 19 additional MessageEvents/MessagePorts, consistent with the worker's periodic control traffic. The final five heap samples were 7,721,036; 7,753,092; 7,766,468; 7,822,056; **7,805,468** bytes. Samples fell at cycles 11 and 15, rather than increasing monotonically. Remaining observed growth is accounted for by runtime warm-up and browser diagnostic entries; no unexplained continuous growth of gameplay owners was observed. This finite experiment cannot prove unlimited-session memory stability or quantify physical GPU memory.

## Requirement status

| Requirement | Status and evidence |
| --- | --- |
| PERF-001 | Verified target in the documented environment: mean 60.0014 FPS, with frame jitter explicitly reported. |
| PERF-002 | Verified: FPS, p95 inter-frame time and sampled entity count above; raw intervals in local profiling output. |
| PERF-003 | Verified: one real match reached the 180-second timeout; no accelerated clock. |
| PERF-004 | Verified: five uniform start/play/exit cycles with heap and ownership results; ten extra investigative cycles. |
| PERF-005 | Verified: investigated retained streams, fixed API worker scope, re-measured five/fifteen cycles and compared snapshots. |
| PERF-006 | Verified: CPU, RAM, OS, browser, renderer, viewport/DPR, complete configuration, procedure and limits documented. |
| LIFECYCLE-001 | Verified: production resource snapshots and existing Pixi/input/audio cleanup tests. |
| LIFECYCLE-002 | Verified: repeated start/exit and restart tests preserve one ticker owner; no retained game subscriptions. |
| LIFECYCLE-003 | Verified in development Strict Mode through the full lifecycle/remount suite. Production profiling is a separate check. |

## Accessibility audit

Native semantic UI remains separate from Pixi rendering. Accessibility trees and rendered text contrast were inspected for Main Menu, Options validation errors, gameplay HUD/state, Pause, Result, Ranking and Match History. Existing browser tests cover asset retry and API initial/background error/retry states, pending registration recovery, pagination and form validation.

| Requirement | Status and specific evidence |
| --- | --- |
| A11Y-001 | Verified: keyboard traversal/activation for menu and Options; log pagination/retry; pause/resume and returning to menu. Result exposes native Play Again/Main Menu buttons with normal tab order. |
| A11Y-002 | Verified: keyboard controls use visible outlines; arena has an inset focus outline. Browser tests inspect computed outlines on menu, form, pagination and retry controls. |
| A11Y-003 | Verified: both settings have explicit labels; step controls and gameplay buttons have meaningful accessible names. |
| A11Y-004 | Verified: native modal dialog, named/described by heading/body, Resume receives initial focus, Tab stays in the modal, Escape resumes, and gameplay focus is restored. Failed resume reopens the modal. |
| A11Y-005 | Verified for the sampled rendered text: normal text ≥4.5:1, large text ≥3:1 (WCAG AA benchmarks). Ranking's highlighted local score was 3.70–3.85:1; using the existing parchment token fixes it. Supplied icon controls retain contrasting artwork and visible focus. |
| A11Y-006 | Verified: `aria-invalid`, hint/error `aria-describedby`, alert validation/API/asset errors, explicit retry and registration status. Retry preserves focus. |
| A11Y-007 | Verified: HUD is a named definition list for health/score/time; match state uses semantic status; tables have captions/column and row headers; registration queue is a semantic list. |
| A11Y-008 | Verified: time publishes by whole-second changes, health/score publish on events, and lifecycle publishes on transitions. HUD has no live region; match status only changes with lifecycle. Existing tests observe ≤1 React commit for one simulated second without combat events, while ≥50 Pixi ticks run. |

Contrast measurement uses actual viewport screenshots with text temporarily hidden to expose the underlying supplied artwork; foreground colors come from computed styles. The central glyph band is sampled to exclude empty line-box space crossing decorative borders. Hidden disclosures, clipped semantic headers and content outside the sampled viewport are excluded. All 28 screen/viewport captures passed after the fixes; four additional Result keyboard checks verified visible focus, tab order and Enter navigation. Raw ratios and accessibility trees are preserved in the evidence. Full-page screenshot capture changed Chromium's coarse-pointer emulation in this environment; viewport capture preserves it, and each screen records pointer/touch capabilities. This is a scoped contrast/semantic audit, not a claim of complete WCAG certification. No physical screen-reader speech session was available; native semantic relationships were checked through Chromium's accessibility representation and source inspection.

The menu's outdated “touch controls are not implemented” instruction was replaced with the actual landscape/simultaneous-touch instructions. Mobile HUD values and Main Menu text previously crossed the gold sprite borders (including a sampled time ratio of 3.75:1). Scoped padding/border sizing keeps text over the dark interior. In landscape widths up to 650 pixels, Main Menu shares the footer row so the HUD fits across the header. Supplied assets and visual language remain intact.

## Responsive and touch audit

The production audit captures 1280×720 desktop, 393×727 touch portrait and 740×360 and 568×320 touch landscape. Existing browser tests also cover 320×640 menus; 568×320, 740×360 and 932×430 gameplay; 390×844 orientation transitions; density changes; and synthetic safe-area insets of 12/24/16/24 pixels.

| Requirement | Status and specific evidence |
| --- | --- |
| RESPONSIVE-001 | Verified: desktop navigation, readable menus/HUD and complete arena. |
| RESPONSIVE-002 | Verified in Chromium mobile emulation: all menu/data/result content remains available; portrait has the rotation instruction. |
| RESPONSIVE-003 | Verified: seven named 48×48 CSS-pixel touch actions; real simultaneous Chromium touch; independent release/cancel and fresh input after resume. |
| RESPONSIVE-004 | Verified/documented: landscape is supported for combat; portrait supports navigation and a rotate-device message. |
| RESPONSIVE-005 | Verified: resize/orientation transitions, no unintended horizontal overflow in the audit. Tall menus intentionally scroll vertically. |
| RESPONSIVE-006 | Verified: equal world scale axes and unchanged logical arena/collision configuration after resize. |
| RESPONSIVE-007 | Verified: actual touch hit testing after resize/DPR changes; actions need no device-to-world aiming conversion. |
| RESPONSIVE-008 | Verified: arena/HUD fitting, letterboxing, touch controls below the arena, compact modal and nonzero safe-area tests. |
| ERROR-005 | Verified in production profile/audit and browser flows: no unhandled application errors. Deliberate HTTP failures may produce expected Chromium transport diagnostics, which are distinguished from application exceptions. |

Physical mobile devices and hardware display cutouts were not measured. Safe-area checks use controlled browser overrides; no claims are made for untested browsers or physical devices. Expanding a mobile-emulated browser to 1440×900 retained a 1.104 page zoom and produced unreliable pointer activation despite correct DOM bounds/hit testing. The keyboard collision/resize regression now pauses through real Escape input and advances its controlled clock so the simulation consumes the request, with an explicit visible-dialog assertion. Dedicated touch regressions still require native taps after resize/orientation/DPR changes. Diagnostic screenshots are viewport captures, with the collision screenshot taken after input checks; no collision, resource, screenshot-comparison or touch assertions were removed.

## Reproduction

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm test -- --workers=2
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

In a second terminal, with no concurrent browser tests while measuring FPS:

```powershell
node scripts/profile-production.mjs
node scripts/audit-accessibility.mjs
$env:E2E_BASE_URL='http://127.0.0.1:4173'
npm test -- tests/e2e/media-api-routing.spec.ts --workers=1
```

`PROFILE_URL` overrides the preview URL. Optional `PROFILE_HEAP=1` captures before/after heap snapshots; `PROFILE_CYCLES=15` extends the five standard cycles for investigation. `PROFILE_ROUTE` is an output filename label only, not a gameplay/configuration switch. `PROFILE_MAX_WALL_MS` is a diagnostic stop bound; shortening it does **not** satisfy PERF-003. The complete match route and real simulation rules are unchanged.

Detailed output lives in `output/playwright/`; HTML regression reports and failure traces use the existing Playwright infrastructure. Profiling measurements must be collected separately from regression tests. The build's existing large-chunk advisory remains; splitting bundles without a measured need is outside this task.

## Validation

Final validation: `npm run typecheck`, `npm run lint`, `npm run test:unit` (93 passed), `npm run build`, and the full `npm test -- --workers=2` regression (121 passed in 8.2 minutes, with `E2E_BASE_URL=http://127.0.0.1:5175`) passed. The optimized production profile completed 180 seconds; the production accessibility script passed all 28 captures and four Result keyboard checks, with no unexpected console/runtime errors. Production media/API routing also passed both browser projects. The mobile gameplay reference image was deliberately updated and visually reviewed for the HUD/button contrast correction. Screenshot comparisons retain their zero-difference thresholds; collision/combat/resource assertions and balance values remain unchanged. The resize flow adds a visible-dialog assertion after simulation consumes real keyboard pause input. The Pixi skill router was read, but its referenced `pixijs-performance` and `pixijs-application` specialized skills were absent from installed skill directories; no missing instructions were invented.
