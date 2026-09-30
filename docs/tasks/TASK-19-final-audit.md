# TASK-19 — Final Audit

## Objective

Perform a traceable requirement-by-requirement release audit and fix only confirmed mandatory gaps or release blockers.

## References

- `docs/CHALLENGE.md` — original Jungle Gaming challenge and authoritative source requirements
- `MASTER_SPEC.md` — all requirement IDs and Definition of Done
- `ARCHITECTURE.md` — implemented architecture and documented tradeoffs
- `DESIGN_SYSTEM.md` — sections 31–33 and final visual/release rules
- `AGENTS.md` — sections 3–5, 15–17 and 22–24
- `docs/TASKS.md` — implementation roadmap
- TASK-16 test/visual evidence
- TASK-17 performance/accessibility evidence
- TASK-18 documentation/deployment evidence

## Skills

- `pixijs`
- `playwright`

Use `pixijs` only when auditing or fixing confirmed PixiJS/game-rendering/lifecycle issues.

Use `playwright` for final browser validation, deployed smoke flows and diagnostic evidence.

## Scope

- Build a final traceability matrix from every mandatory challenge requirement to:
  - implementation location;
  - validation/test evidence;
  - status.
- Audit all MASTER_SPEC requirement IDs and the Definition of Done.
- Cross-check MASTER_SPEC against the original `docs/CHALLENGE.md` so no original source requirement was lost during specification decomposition.
- Review gameplay behavior.
- Review deterministic simulation and lifecycle behavior.
- Review React/Pixi architecture boundaries.
- Review assets and required visual presentation.
- Review desktop/mobile responsive behavior.
- Review accessibility requirements.
- Review Axios/TanStack Query/MSW data architecture.
- Review Ranking and Match History.
- Review submission idempotency and recovery.
- Review automated E2E and visual coverage.
- Review performance evidence.
- Review documentation.
- Review public deployment.
- Review the complete submitted source for accidental or release-risk changes.
- Check for disabled/skipped/focused tests and weakened assertions.
- Check for suppressed errors and unjustified lint/type/test exceptions.
- Check for committed secrets or private credentials.
- Check for leaked/unowned listeners, timers, Pixi resources, audio resources and effects where evidence indicates a lifecycle issue.
- Re-run clean-checkout validation.
- Re-run required deployed smoke flows.
- Fix only confirmed mandatory gaps or release blockers.
- Re-run affected validation after every blocker fix.
- Document non-blocking limitations honestly.

## Out of Scope

- New mechanics.
- New optional features.
- Speculative polish.
- Broad visual redesign.
- Dependency replacement without a release-blocking reason.
- Architecture refactoring without a confirmed mandatory defect.
- Performance optimization without measured evidence.
- Weakening requirements.
- Weakening tests.
- Updating visual baselines merely to hide regressions.
- Treating features outside the challenge as missing requirements.

## Acceptance Criteria

- Every mandatory requirement from `docs/CHALLENGE.md` is traceable.
- Every applicable MASTER_SPEC requirement ID has an explicit final status.
- No mandatory requirement is silently omitted.
- Every implemented mandatory requirement has implementation and/or validation evidence appropriate to that requirement.
- Any unresolved mandatory gap is explicitly identified as a blocker.
- Type checking passes from a clean checkout.
- Lint passes from a clean checkout.
- Required automated tests pass from a clean checkout.
- Production build passes from a clean checkout.
- TEST-001–028 coverage remains present.
- Required visual baselines are present and valid.
- Required performance evidence is present.
- Required accessibility review is present.
- Documentation matches the submitted implementation.
- Public deployment corresponds to the submitted source.
- Required desktop and mobile flows work in the deployed application.
- Ranking, History, submission and recovery flows work in production.
- Expected application flows produce no unhandled console errors.
- No secrets/private credentials are present in submitted source.
- No focused/skipped/disabled tests hide mandatory coverage.
- No confirmed release-blocking resource ownership issue remains unresolved.

## Validation

- Run the documented clean-checkout validation process.
- Run `typecheck`.
- Run `lint`.
- Run required automated/unit/integration tests.
- Run the complete required Playwright suite.
- Run `build`.
- Verify the TEST-001–028 coverage map.
- Verify required visual baselines.
- Verify TASK-17 performance evidence.
- Verify TASK-17 accessibility evidence.
- Verify DOC-001–002.
- Verify DEPLOY-001–005.
- Execute the complete requirement traceability checklist.
- Inspect the complete submitted source/diff.
- Search for focused/skipped/disabled tests.
- Search for suppressed type/lint/test failures.
- Search for committed secrets/private credentials.
- Smoke-test the deployed desktop flow.
- Smoke-test the deployed mobile flow.
- Exercise Main Menu → match → Result → registration → Ranking/History.
- Exercise one required failure/recovery scenario.
- Inspect browser console/network behavior.
- Re-run affected validation after any blocker fix.
