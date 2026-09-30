# TASK-18 — Deployment and Reproduction Evidence

Validated on September 30, 2026. TASK-19 final audit was not performed.

## Public deployment and traceability

| Item | Recorded value |
| --- | --- |
| Platform / account project | Vercel / midrops-projects/desafio-jungle |
| Public production URL | https://desafio-jungle.vercel.app |
| Deployment ID | dpl_3ZKPAuHpeRoY2J4Ww6vvyskV5ihF |
| Deployment URL | https://desafio-jungle-87vxso20h-midrops-projects.vercel.app |
| Inspector | https://vercel.com/midrops-projects/desafio-jungle/3ZKPAuHpeRoY2J4Ww6vvyskV5ihF |
| Deployment creation | 2026-09-30T19:49:59.542Z (16:49:59.542 America/Sao_Paulo) |
| Build runtime | Node 22.x (confirmed in Vercel deployment/project metadata) |
| Build environment | Linux Vercel build in iad1, 2 cores, 8 GB RAM |
| Base source commit | ac42d0149ca71d389297ed42b63c8b246240cc65 |
| Submitted production source | Base commit plus TASK-18 API list validation, Node 22 engine constraint and Vercel configuration |
| Production input manifest SHA-256 | 59bf96e749eef4f8fb0202c97682060efba4b936fb59fd9927f2d1c5fd6ed347 |

No deployment commit was created: this was a CLI upload of the reviewed working tree. Do not describe the base commit alone as the deployed version. [The source/build manifest](./evidence/task-18-deployment.json) records SHA-256 for 590 production input files and comparison of 26 public build files. All JavaScript/CSS bundles matched byte-for-byte; HTML and worker files matched after CR line-ending normalization between Windows and Linux (both exact hashes are retained). JavaScript entry is assets/index-Ci2RKtKC.js. Images/audio are traceable through source hashes and unchanged emitted asset names; they were not all downloaded for byte comparison.

README, architecture/evidence and task status were finalized after deployment. Those documentation changes do not affect the production bundle. Future source changes require another build/deploy and new manifest. The original user-edited TASK-18 instructions were preserved.

## Configuration and verified publishing procedure

vercel.json selects Vite, installs with npm ci, builds with npm run build and publishes dist. package.json and lockfile constrain Node to >=22.12.0 <23.0.0; Vercel project settings use Node 22.x. There are no application environment variables, secrets, functions or private backend. .vercelignore excludes local test artifacts; .vercel/ linking is ignored by Git.

The official Vercel CLI 62.0.0 was used from the repository root:

```sh
npx --yes vercel login
npx --yes vercel link --yes
npx --yes vercel project update desafio-jungle --node-version 22.x --yes
npx --yes vercel deploy --prod --yes
npx --yes vercel inspect https://desafio-jungle-87vxso20h-midrops-projects.vercel.app --json
```

Authenticate to the intended account before linking/deploying. For an existing project in non-interactive automation, identify its team/project explicitly as described by [Vercel CLI deployment documentation](https://vercel.com/docs/cli/deploying-from-cli). Linking may create an ignored .env.local with a Vercel OIDC credential; it is not required by this application and the generated local file was removed after checking the procedure. Never commit it. No Vercel package was added to project dependencies.

Alternatively import the submitted Git repository into Vercel with the same build/runtime settings. This local repository has no configured Git remote; Git-import deployment first requires a source repository. A Git-integrated deployment offers direct commit association, whereas the current CLI upload uses the recorded source manifest.

## Routing and MSW

All screens use in-memory navigation at the root URL. There are no /ranking or /options URL routes and no screen-route rewrite is necessary. Direct open loads Main Menu with fresh storage. Refresh loads saved Result when present, otherwise Main Menu; active combat is abandoned and not registered. These actual semantics were checked instead of inventing deep links.

HTTPS production serves /apiServiceWorker.js and /mockServiceWorker.js as JavaScript. The first filters /api/ before importing the unchanged generated MSW worker. Ranking, History and submission remain browser-local simulated APIs; static images/audio bypass interception. The production alias was opened and tested in fresh unauthenticated Chromium contexts with no protection bypass token. Deployment-specific preview protection does not prevent anonymous access to this public production alias.

## Clean source validation

A tracked-source snapshot from git archive HEAD was extracted into an isolated ignored directory, without copying node_modules, dist, environment files or generated storage. TASK-18 source/docs/hosting changes were overlaid. This approximates a clean checkout of the submitted change, rather than relying on the original workspace dependencies. It is not a separate physical machine and reuses the machine's npm/browser cache.

Reference local environment: Windows, Node 22.22.0, npm 10.9.4. npm ci installed 204 packages from the lockfile. npx playwright install chromium completed after enabling required network access; cached browser binaries were reused. A first restricted attempt stalled and was interrupted. A subsequent reinstall while Vite preview was still running hit a Windows locked native module; stopping preview and repeating npm ci resolved it. Neither issue requires an undocumented application setup step.

| Command/check actually executed | Final result |
| --- | --- |
| npm ci | Passed in the isolated source directory |
| npx playwright install chromium | Passed |
| npm run dev -- --host 127.0.0.1 --port 5175 --strictPort | Started; Main Menu opened in Chromium (5173 was occupied by the full test server) |
| npm run typecheck | Passed |
| npm run lint | Passed |
| npm run test:unit | 94 passed, including malformed HTML/JSON response regression |
| npm test -- --workers=2 | 123 passed in 7.1 minutes, final clean-source run |
| npm run build | Passed; existing large-chunk advisory remains |
| npm run preview -- --host 127.0.0.1 --port 4173 --strictPort | Started; production browser flows opened |
| E2E_BASE_URL=local preview, api-msw/media-api-routing tests | 4 passed in desktop/mobile Chromium |
| E2E_BASE_URL=local preview, ranking-history tests | 14 passed |
| E2E_BASE_URL=public production, production-flow/api-msw/media-api-routing/ranking-history tests | 20 passed in 1.5 minutes against the final Node-22 deployment |
| Public source/build hash comparison | 26 files matched as described above |
| git diff --check | Passed |

The final clean-source suite includes the six visual baseline comparisons; no screenshots were updated. The README snapshot-update workflow is documented for intentional future visual changes and was not executed to rewrite baselines in this task. The first full run completed all 121 then-existing assertions but its process did not promptly exit and was interrupted; the final 123-test run ended successfully. The unit/API change and two production flow tests account for the new totals.

## Actual public production validation

The production-compatible test uses real wall time and real keyboard/touch input; it does not inject a seed, mutate health/entities or advance the simulation directly. Each browser context is fresh. Desktop is 1280×720; mobile starts in 393×727 portrait for menus/Options and switches to supported 740×360 landscape for combat.

Both public browser projects verified: Main Menu direct open; Options duration 60 saved and retained after refresh; Play → Start Match → front attack → actual combat death → Result; NETWORK-014 unavailable registration → Pending → recover → Retry Registration → Confirmed; Result restoration after refresh; exactly one confirmed local record and empty pending queue; Ranking and History UI; NETWORK-012 History refresh failure → recovery/Retry; reset back to fixture History. The additional public suite covers API submission persistence, worker interception, Ranking/History pagination, empty/slow/error/background states, configuration isolation and cancellation. No unexpected page/console errors occurred; deliberate HTTP 503 resource diagnostics were allowed only for the intentional failure scenarios.

Local CLI inspection additionally completed a real match (score 0, 13 seconds displayed, ship destroyed), saved match ID a59baf79-e2c0-4ffd-aecc-069bb9135f8d, recovered registration and restored confirmed Result after refresh. A prolonged CLI session subsequently received static HTML for a list request while the worker still appeared activated, causing an unguarded React exception in the pre-fix bundle. Refresh restored interception; its underlying browser/worker bypass cause was not proven. The API list boundary now validates metadata and records and turns malformed HTML/JSON into the existing Query error/retry state. The regression tests check rejection and successful valid retry. This does not claim to have fixed an unidentified MSW/browser cause. Normal isolated public flows and the final full suite completed without unexpected errors.

## Requirement status

| Requirement | Result and evidence |
| --- | --- |
| DOC-001 | Verified: README setup/runtime, environment handling, controls/mobile, configuration, selection/reset, commands and reproduced failure/recovery instructions |
| DOC-002 | Verified: root architecture matches React/Pixi integration, lifecycle, collision/resources, persistence, APIs/cache/recovery, balance and documented tradeoffs/limits |
| PERF-006 | Verified documentation: actual TASK-17 measurements/environment/limits referenced; measurements were not invented or rerun in TASK-18 |
| DEPLOY-001 | Verified: anonymous public production URL opened and exercised |
| DEPLOY-002 | Verified: deployment ID/base commit plus working-tree changes/source hash manifest; published build comparisons recorded |
| DEPLOY-003 | Verified: direct root open and Options/Result refresh according to actual in-memory navigation |
| DEPLOY-004 | Verified: public Axios/Query/MSW Ranking, History, submission/persistence, failure/recovery/reset in both browser projects |
| DEPLOY-005 | Verified: isolated tracked source installs and runs documented checks/dev/build/preview without private services |

## Known limitations

Chromium mobile emulation is not physical-device validation. TASK-17's software renderer/performance/a11y measurement limitations remain explicit. Browser storage is origin-local, not a shared backend; blocked storage limits durability. Large production chunks retain the existing build advisory. The CLI-session bypass observation is distinguished from the passing ordinary public browser flows above. No universal performance, unlimited-session stability or full WCAG certification is claimed.
