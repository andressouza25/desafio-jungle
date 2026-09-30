# TASK-15 — Match Submission and Recovery

## Objective

Register completed matches exactly once and recover failed or ambiguous submissions without blocking gameplay.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — SUBMIT-001–006, RECOVERY-001–005, DATA-003–005, MATCH-006–008, PERSIST-002–004, ERROR-003–005, NETWORK-013–014 and TEST-024–028
- `ARCHITECTURE.md` — remote-data, persistence and match lifecycle boundaries
- `AGENTS.md` — agent execution rules

## Scope

- Assign each completed match one stable unique match ID.
- Preserve the same match ID across retries, refresh recovery and ambiguous outcomes.
- Build and submit the complete typed match record required by the API contract.
- Submit completed matches only.
- Make the MSW registration endpoint idempotent by match ID.
- Return the existing confirmed record when the same match ID is submitted again.
- Prevent duplicate History/Ranking records for repeated submissions.
- Surface submission status on the Result screen.
- Represent relevant submission states such as submitting, pending/retryable and confirmed.
- Invalidate/refetch relevant Ranking and Match History queries after confirmed registration.
- Persist failed or ambiguous submissions locally as a typed pending queue.
- Restore the pending queue after refresh.
- Allow safe manual retry.
- Prevent unnecessary concurrent submissions for the same pending match.
- Remove a pending item only after registration is confirmed.
- Allow navigation and new matches while previous submissions remain pending.
- Correctly recover timeout-after-server-success using endpoint idempotency.
- Correctly recover unavailable-then-restored API scenarios.
- Keep pending submission persistence separate from completed-result persistence.

## Out of Scope

- Submitting active matches.
- Submitting abandoned matches.
- Real user accounts.
- Real backend/database services.
- Background service worker synchronization.
- Changing Ranking/History presentation beyond what is necessary to reflect confirmed registration.
- Functionality assigned to TASK-16 or later tasks.

## Acceptance Criteria

- Every completed match receives one stable match ID.
- Retries for the same completed match reuse that ID.
- One completed match creates at most one History record and one Ranking entry.
- Repeated clicks cannot create duplicate records.
- Concurrent retry attempts cannot create duplicate records.
- Timeout-after-server-success cannot create duplicate records.
- The idempotent endpoint returns the existing record for an already confirmed match ID.
- Failed or ambiguous submissions enter the typed pending queue.
- Pending submissions survive refresh.
- Pending submissions remain visible and retryable.
- Pending items are removed only after confirmed registration.
- Submission failures do not block Result navigation, Main Menu or starting another match.
- Successful registration/recovery refreshes relevant Ranking and Match History server state.
- Active or abandoned matches are never submitted.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant submission, idempotency, recovery and persistence tests.
- Run `build`.
- Test successful first submission.
- Test repeated submission clicks.
- Test concurrent attempts for the same match ID.
- Test connection failure.
- Test pending persistence across refresh.
- Test manual retry after refresh.
- Test timeout after server success.
- Test unavailable API followed by recovery.
- Test repeated retry after server already contains the match.
- Test successful query invalidation/refetch.
- Verify completed matches are submitted.
- Verify abandoned/active matches are not submitted.
- Inspect local pending storage and mock API records for exact-once behavior.
