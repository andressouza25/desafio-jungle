# TASK-13 — API, MSW and Remote Data

## Objective

Build the typed mocked REST infrastructure, persistence and reproducible network scenarios required by remote features.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview and runtime commands
- `MASTER_SPEC.md` — TECH-004–006, DATA-001–005, NETWORK-001–014, RANKING-001–006, HISTORY-001–003 and PERSIST-003–004
- `ARCHITECTURE.md` — remote-state, API, persistence and application boundaries
- `AGENTS.md` — agent execution rules

## Scope

- Define shared typed request/response contracts for Ranking, Match History and match submission.
- Include all required match/configuration fields in remote contracts.
- Configure one shared Axios client for remote HTTP communication.
- Implement typed API functions on top of the Axios client.
- Configure TanStack Query defaults for the required freshness, retry and cancellation behavior.
- Forward cancellation signals through API functions to Axios where applicable.
- Implement MSW handlers for Ranking, Match History and match submission.
- Create representative deterministic fixtures for other players.
- Implement required pagination behavior.
- Implement ranking within equivalent match configuration.
- Implement deterministic score ordering and tie-breaking.
- Persist confirmed mock records where required for browser-local API behavior.
- Provide explicit selectable and resettable network scenarios covering NETWORK-001–014.
- Support success, empty, multi-page, latency, ordering/out-of-order, timeout, connection and HTTP-error behavior as required by the specification.
- Make latency and scenario behavior deterministic/controllable in tests.
- Isolate scenario state and persisted mock data between tests.
- Initialize MSW in development and production builds as required by the challenge.
- Keep test setup able to reset handlers, scenario state and mock persistence reliably.

## Out of Scope

- Ranking screen implementation.
- Match History screen implementation.
- Final responsive Ranking/History tables.
- Wiring completed gameplay results into submission.
- Pending submission/recovery behavior.
- Real backend services.
- Authentication.
- External databases.
- Functionality assigned to TASK-14 or later tasks.

## Acceptance Criteria

- All remote feature calls use typed API functions backed by the shared Axios client.
- Server-state freshness, retry and cancellation policy is owned by TanStack Query.
- Contracts are strictly typed and contain all required match/configuration fields.
- MSW behaves as the mock HTTP backend rather than bypassing Axios.
- Required mock records persist according to the specification.
- NETWORK-001–014 scenarios are reproducible, selectable and resettable.
- Test runs can reset handlers, scenarios and persisted mock data independently.
- Ranking compares records only within the required equivalent configuration context.
- Ranking ordering is score-based with deterministic tie-breaking.
- Pagination responses are deterministic.
- Latency and failure behavior can be controlled without ambient randomness in tests.
- Cancellation propagates through the remote request path.
- Older delayed responses cannot replace newer valid application state.
- Development and production builds can use the MSW-backed API without private services.
- No Ranking or Match History UI is implemented prematurely.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant API, contract, handler, scenario and persistence tests.
- Run `build`.
- Test Ranking ordering and deterministic tie-breaking.
- Test equivalent-configuration filtering/context.
- Test Match History pagination.
- Test match submission handler behavior.
- Exercise every NETWORK-001–014 scenario.
- Verify deterministic latency and isolated mock persistence.
- Test request cancellation.
- Test out-of-order responses and stale-response protection.
- Reset scenarios repeatedly and verify no state leaks between tests.
- Serve the production build and verify MSW intercepts representative Ranking and Match History requests.
