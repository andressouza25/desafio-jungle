# TASK-14 — Ranking and Match History

## Objective

Implement accessible, responsive Ranking and Match History screens backed exclusively by Axios and TanStack Query.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — SCREEN-005–006, RANKING-001–006, HISTORY-001–003, DATA-001–005, ERROR-001–002, ERROR-004–005 and A11Y-001–006
- `ARCHITECTURE.md` — remote-state and UI boundaries
- `DESIGN_SYSTEM.md` — Ranking, History, responsive data and accessibility rules
- Supplied `sample_ranking.png` and `sample_history.png`
- `AGENTS.md` — agent execution rules

## Skills

- `frontend-design`

Use this skill for screen composition, responsive data presentation and accessible interaction.

Supplied reference screens, assets and `DESIGN_SYSTEM.md` remain the visual source of truth.

## Scope

- Implement typed TanStack Query hooks for Ranking and Match History using the TASK-13 API layer.
- Keep all remote HTTP communication behind the shared Axios-backed API functions.
- Include page and all relevant request context in query keys.
- Display all fields/columns required by the specification.
- Use server-driven ordering and pagination.
- Implement pagination controls from server response metadata.
- Implement distinct initial-loading, empty, error and content states.
- Provide explicit retry actions for recoverable failures.
- Handle background fetching separately from initial loading where appropriate.
- Configure/use the required cache freshness and return-to-screen behavior.
- Prevent delayed older requests/pages from being presented as newer state.
- Preserve supplied Ranking and History visual hierarchy.
- Adapt dense data for mobile while preserving all required information.
- Provide appropriate semantic table/list structure.
- Provide accessible pagination names/state and keyboard-visible controls.
- Preserve usable focus behavior across loading, retry and pagination transitions.

## Out of Scope

- Match submission.
- Pending submission/recovery.
- Gameplay changes.
- Client-side replacement for server ordering.
- Client-side replacement for server pagination.
- New filters.
- New data visualization.
- Changes to TASK-13 MSW contracts unless a genuine contract defect is discovered.
- Functionality assigned to TASK-15 or later tasks.

## Acceptance Criteria

- Ranking and Match History use TanStack Query hooks backed by the shared Axios API layer.
- Components do not duplicate server data into unnecessary React-owned state.
- Query keys distinguish pages and relevant data contexts correctly.
- Ordering and pagination remain server-driven.
- Initial loading, empty, error, retry, content and background-fetch states behave correctly.
- Cached return behavior follows the configured freshness policy.
- Out-of-order responses cannot display an older page/context as the newer requested state.
- All required Ranking and History fields remain available and readable on desktop and supported mobile layouts.
- Pagination controls expose appropriate accessible labels and state.
- Interactive controls have visible keyboard focus.
- API failures remain isolated from gameplay.
- Expected API failures produce no unhandled runtime/console errors.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant Ranking, History, query and responsive tests.
- Run `build`.
- Exercise success scenario.
- Exercise empty scenario.
- Exercise multi-page scenario.
- Exercise slow/latency scenario.
- Exercise recoverable error and retry.
- Exercise out-of-order response scenario.
- Test page changes and query-key isolation.
- Test cached return/background refresh behavior.
- Verify semantic table/list structure.
- Verify keyboard navigation and visible focus.
- Verify pagination accessibility.
- Compare desktop layouts against `sample_ranking.png` and `sample_history.png`.
- Verify responsive layouts preserve all required information on supported mobile sizes.
