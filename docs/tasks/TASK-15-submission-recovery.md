# TASK-15 — Match Submission and Recovery

## Objective

Register completed matches exactly once and recover failed or ambiguous submissions without blocking gameplay.

## References

- `MASTER_SPEC.md`: SUBMIT-001–006, RECOVERY-001–005, DATA-003–005
- `MASTER_SPEC.md`: MATCH-006–008, PERSIST-002–004, ERROR-003–005
- `MASTER_SPEC.md`: NETWORK-013–014, TEST-024–028
- `AGENTS.md`: section 12

## Scope

- Assign each completed match a stable unique ID and submit its complete typed record.
- Make the MSW registration endpoint idempotent by match ID and return existing records on repeats.
- Surface registration status on Result and invalidate/refetch relevant Ranking and History queries after confirmation.
- Persist failed/unknown submissions locally as a typed pending queue.
- Restore the queue after refresh and provide safe retry without preventing a new match.
- Correctly handle timeout after server success and unavailable-then-recovered API scenarios.

## Out of Scope

- Submitting abandoned or active matches.
- Real accounts, server database or background service worker sync.
- Changing Ranking/History presentation beyond registration status updates.

## Acceptance Criteria

- One completed match creates at most one History record and one Ranking entry.
- Repeated clicks, retries and timeout-after-success never duplicate records.
- Pending submissions survive refresh, are visible/retryable and are removed only after confirmation.
- Submission failures do not block navigation or starting another match.
- Successful submission/recovery refreshes relevant cached data.

## Validation

- Run `typecheck`, `lint`, submission/recovery tests and `build`.
- Test duplicate clicks, connection failure, refresh recovery, timeout-after-success and later recovery with fixed match IDs.
- Verify completed versus abandoned matches and inspect stored/API records for exact-once behavior.
