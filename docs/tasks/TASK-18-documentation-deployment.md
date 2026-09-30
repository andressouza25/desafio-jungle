# TASK-18 — Documentation and Deployment

## Objective

Make the implemented project reproducible from a clean checkout and publish the matching production build.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project documentation
- `MASTER_SPEC.md` — DOC-001–002, DEPLOY-001–005, NETWORK-001–014, PERF-006 and Definition of Done
- `ARCHITECTURE.md` — architecture documentation
- `DESIGN_SYSTEM.md` — supported responsive/UI behavior where documentation requires it
- TASK-17 performance/accessibility evidence
- `AGENTS.md` — validation, documentation and delivery rules

## Skills

- `playwright`

Use only where useful for deployed user-flow validation and diagnostic artifacts.

## Scope

- Audit README against the actual implemented project.
- Document exact prerequisites and supported runtime/tool versions.
- Document installation and local development.
- Document production build and preview.
- Document gameplay controls for keyboard and touch.
- Document supported mobile orientation/behavior.
- Document configurable gameplay options.
- Document all relevant validation/test commands.
- Document network scenario selection and reset using the actual TASK-13 implementation.
- Document how to reproduce required network failure/recovery scenarios.
- Document performance evidence produced by TASK-17.
- Complete `ARCHITECTURE.md` with all topics required by DOC-002.
- Document important architectural decisions, boundaries and tradeoffs.
- Document known limitations truthfully.
- Configure production hosting.
- Configure client-side direct-open/refresh behavior where required.
- Ensure production requires no private backend/service.
- Ensure MSW initializes correctly in the deployed production build.
- Publish the production build from the submitted source.
- Record the public production URL.
- Record the hosting/deployment procedure.
- Record the deployed source revision/commit where possible.
- Validate representative gameplay and remote-data flows against the public deployment.

## Out of Scope

- New product features.
- Real backend infrastructure.
- Unrelated documentation duplication.
- Rewriting architecture solely for documentation.
- Hiding known limitations.
- Documenting behavior that does not exist.
- Broad requirement remediation unrelated to a documentation/deployment blocker.
- TASK-19 final requirement audit.

## Acceptance Criteria

- A clean checkout can be installed using the documented prerequisites and commands.
- A clean checkout can start development mode.
- Documented `typecheck`, `lint`, automated test and build commands work.
- Production preview works using the documented procedure.
- README accurately documents controls, configuration, tests and network scenarios.
- `ARCHITECTURE.md` covers DOC-002 and matches the implemented architecture.
- TASK-17 performance evidence and its reference environment are documented.
- Known limitations are explicit.
- A public production deployment is available.
- The deployed application corresponds to the submitted source/revision.
- Direct opening and refresh work on required application screens/routes.
- Production requires no private backend/service.
- MSW-backed Ranking, History and submission/network behavior operate in production.
- Gameplay operates correctly in the deployed build.
- The public production URL and deployment procedure are recorded.

## Validation

- Validate documentation from a clean checkout/environment.
- Follow README commands rather than relying on undocumented local knowledge.
- Run `typecheck`.
- Run `lint`.
- Run required automated tests.
- Run `build`.
- Run production preview.
- Validate the public deployment.
- Directly open/refresh required screens/routes.
- Exercise one complete match.
- Exercise Ranking.
- Exercise Match History.
- Exercise one required network failure scenario.
- Exercise recovery/reset from that scenario.
- Verify MSW interception in production.
- Check representative supported desktop/mobile viewports.
- Review browser console for unexpected runtime/network errors.
- Verify the recorded deployment revision matches the intended submitted source.
