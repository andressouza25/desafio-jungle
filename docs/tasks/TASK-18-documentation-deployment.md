# TASK-18 — Documentation and Deployment

## Objective

Make the implemented project reproducible from a clean checkout and publish the matching production build.

## References

- `MASTER_SPEC.md`: DOC-001–002, DEPLOY-001–005
- `MASTER_SPEC.md`: NETWORK-001–014, PERF-006 and Definition of Done
- `README.md`: Setup, Controls, Testing and Deployment
- `AGENTS.md`: sections 15, 18 and 20

## Skills

- `playwright` — use only for deployed user-flow validation and diagnostic artifacts.

## Scope

- Update `README.md` with actual setup, environment, controls, configuration, scenario selection/reset and all development/validation commands.
- Complete `docs/ARCHITECTURE.md` with the topics required by DOC-002, including tradeoffs and known limitations.
- Document network failure reproduction and performance evidence from TASK-17.
- Configure production hosting and client-side refresh behavior without private services.
- Publish a public deployment from the submitted source and verify MSW-backed remote features.
- Record the production URL and deployment procedure.

## Out of Scope

- New product features, real backend infrastructure or unrelated documentation duplication.
- Hiding known limitations or documenting behavior not present in source.
- Final requirement remediation beyond deployment/documentation blockers.

## Acceptance Criteria

- A clean checkout can install, develop, test, build and preview using documented commands.
- README and Architecture documentation match the implementation and cover DOC-001–002.
- The public deployment matches submitted source, supports direct open/refresh and requires no private service.
- Gameplay, Ranking, History and MSW scenarios operate in production.

## Validation

- Follow the README from a clean environment and run `typecheck`, `lint`, automated tests and `build`.
- Open and refresh the public URL at supported screens/viewports.
- Exercise a match, Ranking, History, one network failure and recovery in the deployed build; review browser console errors.
