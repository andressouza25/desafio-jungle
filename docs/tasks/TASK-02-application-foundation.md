# TASK-02 — Application Foundation

## Objective

Establish application boundaries, providers and screen navigation without implementing feature behavior.

## References

- `MASTER_SPEC.md`: ARCH-001–006, SCREEN-001–006, MATCH-006–008, QUALITY-002–006
- `README.md`: Architecture and Application
- `AGENTS.md`: sections 4–6, 9 and 19

## Scope

- Create cohesive modules for React UI, game, data, mock API, persistence and tests.
- Add application providers, including the TanStack Query client boundary.
- Implement typed application navigation among placeholder Main Menu, Options, Game, Result, Ranking and Match History views.
- Define only the application-level state needed to enter and leave screens.
- Ensure leaving combat has a clear future hook for abandoning and destroying an active match.

## Out of Scope

- Game simulation, PixiJS setup or gameplay state in React.
- Final screen content, styling, data fetching or persistence behavior.
- A routing library unless analysis shows a concrete need.

## Acceptance Criteria

- All required views can be reached and exited through semantic controls.
- Module boundaries match the architecture specification.
- Continuous game state is absent from React application state.
- Providers and navigation remain safe under React Strict Mode.

## Validation

- Run `typecheck`, `lint`, relevant component tests and `build`.
- Manually traverse every placeholder view with mouse and keyboard.
- Repeat navigation and inspect the console for duplicate effects or errors.
