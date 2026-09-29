# TASK-13 — API, MSW and Remote Data

## Objective

Build the typed mocked REST infrastructure, persistence and reproducible network scenarios required by remote features.

## References

- `MASTER_SPEC.md`: TECH-004–006, DATA-001–005, NETWORK-001–014
- `MASTER_SPEC.md`: RANKING-001–006, HISTORY-001–003, PERSIST-003–004
- `AGENTS.md`: sections 7, 12, 15 and 18

## Scope

- Define shared request/response contracts for Ranking, Match History and match submission.
- Configure one Axios client and TanStack Query defaults suitable for the specified freshness, retry and cancellation behavior.
- Implement MSW handlers, representative other-player fixtures, pagination, ranking context and deterministic tie-breaking.
- Persist confirmed mock records as required for browser-local API behavior.
- Provide selectable/resettable success, empty, multi-page, latency, ordering, timeout, connection and HTTP-error scenarios.
- Make latency/randomness controllable in tests and initialize MSW in development and production builds.

## Out of Scope

- Ranking and Match History screens.
- Wiring completed gameplay results into submission/recovery.
- Real backend, authentication or database services.

## Acceptance Criteria

- Remote calls flow through Axios; server-state policy lives in TanStack Query.
- Contracts and handler data are strictly typed and include required match fields.
- All NETWORK-001–014 scenarios are reproducible, selectable and resettable.
- Ranking is score-ordered within equivalent configuration and ties are deterministic.
- Older delayed responses cannot replace newer valid state.
- The worker functions in the production build without private services.

## Validation

- Run `typecheck`, `lint`, API/handler tests and `build`.
- Exercise every scenario with deterministic latency and isolated storage.
- Serve the production build and verify MSW intercepts representative Ranking and History requests.
