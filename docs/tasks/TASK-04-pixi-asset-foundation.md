# TASK-04 — PixiJS and Asset Foundation

## Objective

Establish one well-owned PixiJS lifecycle and a recoverable asset-loading path inside the React Game screen.

## References

- `docs/CHALLENGE.md` — official challenge requirements
- `README.md` — project overview
- `MASTER_SPEC.md` — global implementation rules
- `ARCHITECTURE.md` — React, simulation and PixiJS boundaries
- `DESIGN_SYSTEM.md` — gameplay visual and asset rules
- Supplied gameplay assets, spritesheets and loading references
- `AGENTS.md` — agent execution rules

## Skills

- `pixijs`

Use this skill for PixiJS lifecycle, rendering, asset management, resize and cleanup decisions.

Project specifications and architecture take priority over skill recommendations.

## Scope

- Mount and destroy a PixiJS application through a narrow React integration boundary.
- Keep PixiJS application ownership outside React render state.
- Implement logical arena sizing, viewport resize and device-pixel-ratio handling.
- Create a typed asset manifest for the assets required by this foundation.
- Load assets once where appropriate and expose visible loading progress to React.
- Handle asset-loading failures with a clear retry action.
- Render a minimal water arena from supplied assets to prove sizing, texture reuse and cleanup.
- Establish explicit ownership and cleanup for PixiJS resources, ticker callbacks and browser listeners.

## Out of Scope

- Player controls or input systems.
- Game simulation.
- Collision.
- Weapons and projectiles.
- Enemies and spawning.
- Match rules.
- Final arena composition.
- Combat effects.
- Gameplay state stored in React.
- PixiJS rendering state as gameplay source of truth.
- Functionality assigned to TASK-05 or later tasks.

## Acceptance Criteria

- Only one PixiJS application and ticker are active per Game instance.
- React owns the integration boundary, not frame-by-frame rendering state.
- Combat cannot begin before required assets load successfully.
- Loading progress is visible.
- Loading failure is visible and retryable.
- Resize and DPR changes preserve logical coordinates and avoid unintended clipping.
- Supplied assets are reused without destructive modification.
- Teardown releases owned PixiJS resources, ticker callbacks and listeners.
- Strict Mode remounting does not create duplicate canvases, listeners or loops.
- No gameplay behavior is introduced.

## Validation

- Run `typecheck`.
- Run `lint`.
- Run relevant asset-loading/lifecycle tests.
- Run `build`.
- Exercise successful loading.
- Exercise loading failure and retry.
- Resize through representative desktop and mobile dimensions.
- Mount, unmount and remount Game repeatedly.
- Verify only one canvas and ticker exist per Game instance.
- Verify there are no duplicate listeners or unhandled console errors.
