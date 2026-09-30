# TASK-16 — Automated Coverage Audit

The initial map was created before TASK-16 implementation against commit `ffecdc7`. Each requirement was read individually and the actual assertions inspected. The initial run exposed asset-interception, menu-focus synchronization and native mobile Pause activation failures. The final map below records the resulting coverage, including the previously missing browser checks.

## TEST-001–028

All paths below are relative to `tests/e2e/` unless explicitly identified as unit tests.

| Requirement | Automated evidence | Verification |
| --- | --- | --- |
| TEST-001 Options | `options.spec.ts`: validates settings and persists only valid saves after reload | Covered: invalid limits/types, valid saves, refresh and discarded edits |
| TEST-002 Assets | `pixi-foundation.spec.ts`: six asset failure/retry cases; leaving during loading | Covered: progress, retry and late completion cleanup |
| TEST-003 Start | `simulation-lifecycle.spec.ts`: drives lifecycle; `player-input.spec.ts` | Covered: ready → Start Match → real ticker/player |
| TEST-004 Movement/rotation | `player-input.spec.ts`: real keyboard moves, turns and fires | Covered: actual keys, rendered transforms, simultaneous inputs |
| TEST-005 Bounds | `player-input.spec.ts`: four arena edge keyboard pipeline cases | Covered: blocked motion and turning away |
| TEST-006 Island | `player-input.spec.ts`: four island side approaches; visual-only transforms | Covered: real movement and immutable logical geometry |
| TEST-007 Attacks | `weapons-projectiles.spec.ts`: front and both broadsides; rotated origins | Covered: 1/3/3 shots and ship-relative trajectories |
| TEST-008 Damage/cooldown | `weapons-projectiles.spec.ts`, `enemies-spawning.spec.ts`, `combat-behavior.spec.ts` | Independent repeat cooldowns; real player/enemy damage, health bars and impact/destruction feedback |
| TEST-009 Score | `enemies-spawning.spec.ts`: real-input seeded kill | HUD/domain score is exactly 1 and remains 1 on later simulation steps after target removal; unit match-rules supplements exactly-once resolution |
| TEST-010 Chaser | `combat-behavior.spec.ts`: seeded pursuit/contact | Real steering, decreasing distance, exactly configured contact damage, sprite removal, unchanged health on the next interval and no points |
| TEST-011 Shooter | `combat-behavior.spec.ts`, `enemies-spawning.spec.ts` | Approaches into configured range, fires real enemy projectiles and reduces visible player health; can be damaged/destroyed by real fire |
| TEST-012 Spawns | `combat-behavior.spec.ts`: Options spawn cadence | Before/after configured interval, no spawning while paused, next interval, clean seed-preserving restart; unit tests supplement safe spawning/distribution |
| TEST-013 Timeout | `match-rules.spec.ts`: timeout result persists | Covered: real clock advancement, 60 seconds, frozen completed result |
| TEST-014 Death | `match-rules.spec.ts`: real enemy combat ends by player death | Covered: genuine enemy damage, effective duration and immutable result |
| TEST-015 Restart | `match-rules.spec.ts`, `weapons-projectiles.spec.ts`, `enemies-spawning.spec.ts` | Covered: fresh health/score/time, entities/cooldowns/input and deterministic restart |
| TEST-016 Pause | `simulation-lifecycle.spec.ts`, `weapons-projectiles.spec.ts`, `pause-feedback.spec.ts` | Covered: suspended ticker/time/projectiles, explicit resume |
| TEST-017 Focus/visibility | `simulation-lifecycle.spec.ts`, `player-input.spec.ts`, `touch-responsive.spec.ts` | Covered: blur/hidden pause, rejected hidden resume, cleared held inputs |
| TEST-018 Result | `match-rules.spec.ts`, `submission-recovery.spec.ts` | Covered: real result and full persisted record after refresh |
| TEST-019 Abandon | `submission-recovery.spec.ts`, `registration-refresh.spec.ts` | Active/menu-abandoned/refresh-abandoned matches never create submission/result; fresh subsequent battle has full health, zero score/time |
| TEST-020 Navigation | `navigation.spec.ts`, `pixi-foundation.spec.ts` | Covered: repeated menu/game transitions and resource cleanup |
| TEST-021 Touch | `touch-responsive.spec.ts`, `player-input.spec.ts` | All actions, genuine simultaneous Chromium touch, ownership/cancellation/cleanup and keyboard activation of native mobile Pause; touch-only file is selected only by mobile project |
| TEST-022 Ranking | `ranking-history.spec.ts`: Ranking server pages, states/retry/cache | Covered: fields, configuration isolation, loading/empty/error/content and paging |
| TEST-023 History | `ranking-history.spec.ts`: Match History server pages, states/retry/cache | Covered: required fields, loading/empty/error/content and paging |
| TEST-024 Register | `submission-recovery.spec.ts`: completed match confirms once | Covered: actual completion → Query/Axios/MSW → durable confirmation |
| TEST-025 Refresh lists | `registration-refresh.spec.ts`: real registration refreshes warmed tabs | Both tabs loaded before gameplay; real timeout/registration; new Ranking row and newest History details show the exact completed UUID/duration |
| TEST-026 Pending refresh | `submission-recovery.spec.ts`: NETWORK-008/014 and independent pending battles | Covered: genuine failed completion, reload, manual retry and independent removal |
| TEST-027 Ambiguous timeout | `submission-recovery.spec.ts`: NETWORK-013 | Covered: committed server record, client pending, same-ID retry, one history/ranking record |
| TEST-028 Out of order | `ranking-history.spec.ts`: old page responses cannot replace requested page | Covered: real MSW latency sequences and final visible current page; unit cancellation supplements |

## Determinism

| Requirement | Evidence / approach |
| --- | --- |
| TEST-DETERMINISM-001 | `GameInstance` validates a uint32 `__pirateBattleTestSeed` before constructing the existing seeded controller, only behind `import.meta.env.DEV`. Helpers inject seed 1 for standard flows and seed 7 for Chaser contact. Restarts reuse the seed. The built production assets contain no test seed key. Unit spawning/simulation checks supplement multiple seeds. |
| TEST-DETERMINISM-002 | Playwright clock controls browser frame delivery with fixed dates. Terminal-flow helpers control only the observed controller's existing `advance` clock in bounded 100ms deliveries, never entities/results. Screenshot gameplay freezes at a fixed sequence of real input and clock steps. |
| TEST-DETERMINISM-003 | Combat attacks use actual keyboard/touch actions → input → weapons/projectiles → collision/damage → observable HUD/rendered consequences. No insertion of enemies/projectiles, health assignment or forced score. |
| TEST-DETERMINISM-004 | Every test receives a fresh browser context/origin storage/worker/Query client/game instance. New helpers explicitly verify empty persistence and reset MSW records/scenarios/cache. Auto fixtures reject all unexpected runtime/console errors. Unit tests reset their storage/handlers/scenarios/clients. Repeated subsets and separately scheduled reverse-file runs verify practical execution-order independence. |

## Visual baselines

Before TASK-16, existing screenshots were run artifacts only. `visual-regression.spec.ts` now asserts all six versioned PNGs with zero allowed differing pixels under Playwright's default perceptual color threshold. All images were manually opened and compared with `assets/sample_menu.png`, `assets/sample.png` and `assets/sample_result.png`; wood/gold/navy artwork, HUD, arena, portrait wrapping and controls remain consistent with the existing design. No UI redesign was introduced.

| Requirement | Desktop baseline | Mobile baseline |
| --- | --- | --- |
| VISUAL-001 Main Menu | `tests/e2e/visual-baselines/desktop-chromium/main-menu.png` | `tests/e2e/visual-baselines/mobile-chromium/main-menu.png` |
| VISUAL-002 Gameplay | `tests/e2e/visual-baselines/desktop-chromium/gameplay.png` | `tests/e2e/visual-baselines/mobile-chromium/gameplay.png` |
| VISUAL-003 Result | `tests/e2e/visual-baselines/desktop-chromium/result.png` | `tests/e2e/visual-baselines/mobile-chromium/result.png` |

Desktop viewport is 1280×720. Mobile menu/result is 393×727; supported landscape gameplay is 740×360. Locale is en-US and timezone UTC. Screenshots fix browser date/seed, disable presentation animations/caret and keep actual game truth unchanged. Result is reached by real production death/completion and confirmed through Query/Axios/MSW. Windows Chromium baselines require deliberate review when changing OS/browser/rendering environment.

## Failure diagnostics

HTML report, retained failure traces, failure-only screenshots/video, zero retries and `forbidOnly` are configured. A temporary test expected `CONTROLLED FAILURE` from the real Play button. It failed exactly once without retries. The trace viewer showed the failed locator/action, actual menu DOM, parameters and network timeline; the HTML report showed expected/actual text and linked all artifacts. The failure PNG and a decoded video frame showed the correct menu/Play button. Video metadata confirmed a 4.08-second playable VP8 recording. The expectation was restored to `Play` and the same test passed on rerun before the temporary file was removed. Diagnostic outputs remain ignored under `output/playwright/controlled-failure/` and `output/playwright/controlled-report/`; the passing rerun is in `output/playwright/restored-report/`. No intentional failure remains in the final suite.

Asset tests route only PNG HTTP requests at browser-context level, including service-worker-owned asset requests, so failed assets actually reach the loader/retry path. Module imports and all API requests remain on their original routes; MSW is active throughout. Console checks reject unexpected errors, with existing network tests narrowly accounting for intentional resource failure diagnostics.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed. Generated diagnostic/report assets are excluded with the same policy as existing Playwright output.
- `npm run test:unit`: 93 passed.
- `npm run build`: passed; existing large-chunk advisory remains. Verified that built assets contain no `__pirateBattleTestSeed` key.
- First passing complete run, `npm test -- --workers=2` against the isolated development server: **119 passed (6.9 minutes)**, 58 desktop-chromium and 61 mobile-chromium, zero failed/flaky/skipped/retried. HTML report reviewed and preserved in ignored `output/playwright/full-report/`. Final validation after the follow-up corrections below is recorded separately.
- All six visual assertions passed without snapshot updates after generation/manual review, both in the focused rerun and full suite.
- Reverse file scheduling: weapons → submission recovery (NETWORK-013) → Ranking/History out-of-order → Chaser, one worker, desktop Chromium: **5 passed** across four separate invocations.
- Controlled diagnostic failure: 1 expected failure; restored expectation rerun: **1 passed**; temporary file deleted.
- Final source search found no `test.skip`, `test.fixme`, `test.only`, arbitrary `waitForTimeout`, ambient `Date.now` or `Math.random` in E2E sources. Configured E2E retries are zero. Browser runtime/console assertions passed (intentional failed-HTTP resource diagnostics remain explicitly accounted for).

- Repetition: `npm test -- tests/e2e/combat-behavior.spec.ts tests/e2e/enemies-spawning.spec.ts tests/e2e/weapons-projectiles.spec.ts tests/e2e/match-rules.spec.ts tests/e2e/ranking-history.spec.ts tests/e2e/submission-recovery.spec.ts tests/e2e/registration-refresh.spec.ts --workers=2 --repeat-each=2`: **96 passed (6.9 minutes)**. This comprises 40 gameplay and 56 network/registration/recovery executions, each selected case repeated twice in both projects, with zero retries. Report: ignored `output/playwright/repeat-report/index.html`.

Follow-up validation found generated trace HTML causing Vite page reloads and two wall-clock execution budgets expiring under slower mobile rendering. Vite now excludes only generated Playwright outputs. The two-timeline spawn case has a 60-second runner deadline; gameplay intervals and assertions are unchanged. The touch terminal-cleanup case now uses the existing bounded production simulation-clock helper with its real touch actions held, rather than rendering all 3,600 intermediate frames. Its default 30-second deadline is sufficient; the old 90-second override was removed. Before terminal completion it verifies two pressed buttons; after Play Again it verifies cleared presses, initial rotation and no inherited shots. A focused two-repeat mobile run passed all six touch cases (45.7 seconds), with terminal completion cases taking 4.1 seconds each. The shared controller observer can omit its Pixi hook so the touch file retains sole ownership of that observation hook.

Final validation after all follow-up corrections: `npm test -- --workers=2` passed **119 tests (9.0 minutes)**, comprising 58 desktop and 61 mobile tests, with zero failures, skips or retries. The final HTML report is `playwright-report/index.html`. A further two-repeat run of Options spawn cadence, NETWORK-013 recovery and all three mobile touch cases passed **14 tests (1.9 minutes)**; report: ignored `output/playwright/final-repeat-report/index.html`. Typecheck and lint passed after the final helper/touch edits; the final diff whitespace check passed.

No requirement is deferred to TASK-17; physical devices and unsupported browser engines are outside this task's browser matrix. No mandatory scenario remains unautomated. Visual baselines were reviewed on Windows Chromium, so changing the rendering environment requires deliberate review. Performance profiling, broad accessibility auditing and deployment are later tasks.
