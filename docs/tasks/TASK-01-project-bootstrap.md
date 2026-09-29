# TASK-01 — Project Bootstrap

## Objective

Create the smallest runnable React and strict TypeScript project with the mandatory dependencies and validation commands.

## References

- `README.md`: Tech Stack, Setup and Testing
- `MASTER_SPEC.md`: TECH-001–007, TEST-001–028, VISUAL-001–003
- `AGENTS.md`: sections 7, 15, 16 and 18

## Scope

- Configure React, TypeScript strict mode and the chosen build tool.
- Install the required runtime libraries: PixiJS, Axios, TanStack Query and MSW.
- Configure linting, type checking and Playwright with desktop and mobile Chromium projects.
- Add development, build, preview, lint, typecheck and test scripts.
- Render a minimal accessible application entry and add one smoke test proving the test runner can launch it.

## Out of Scope

- Product navigation, final visual styling or asset loading.
- Gameplay, remote-data behavior or MSW endpoints.
- Extra dependencies without a current, documented responsibility.

## Acceptance Criteria

- A clean install can start the development server and produce a production build.
- TypeScript strict mode is enabled without suppressed errors.
- Required technologies are installed and scripts have stable names.
- Playwright launches the application in at least one smoke test.

## Validation

- Run the package install appropriate to the committed lockfile.
- Run `typecheck`, `lint`, the smoke test and `build`.
- Start `preview` and verify the entry screen loads without unhandled console errors.
