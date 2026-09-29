# TASK-14 — Ranking and Match History

## Objective

Implement accessible, responsive Ranking and Match History screens backed exclusively by Axios and TanStack Query.

## References

- `MASTER_SPEC.md`: SCREEN-005–006, RANKING-001–006, HISTORY-001–003, DATA-001–005
- `MASTER_SPEC.md`: ERROR-001–002 and ERROR-004–005, A11Y-001–006
- `DESIGN_SYSTEM.md`: sections 10–14, 21, 24–25 and 27–32
- Supplied `sample_ranking.png` and `sample_history.png`

## Skills

- `frontend-design`

## Scope

- Fetch Ranking and Match History through typed query hooks using the shared Axios client.
- Display the required columns/fields and server-driven pagination.
- Implement distinct loading, empty, error and content states with retry.
- Configure cache, background refresh and return-to-screen freshness behavior.
- Preserve the supplied visual hierarchy while adapting dense data for mobile readability.
- Provide semantic table/list structure, pagination labels and keyboard-visible controls.

## Out of Scope

- Match submission, pending recovery or changes to gameplay.
- Client-side replacement for server ordering/pagination.
- New data visualization or filtering not required by the challenge.

## Acceptance Criteria

- Both screens use TanStack Query and Axios with no duplicate React-owned remote state.
- Pagination, loading, empty, failure, retry and cached return behavior are correct.
- Out-of-order responses do not show stale page data as newer state.
- All required fields are readable on desktop and mobile.
- API errors remain isolated from gameplay and produce no unhandled console errors.

## Validation

- Run `typecheck`, `lint`, screen/query tests and `build`.
- Exercise success, empty, multi-page, slow, error and out-of-order scenarios.
- Verify keyboard/focus behavior, semantic structure and responsive layouts against both reference screens.
