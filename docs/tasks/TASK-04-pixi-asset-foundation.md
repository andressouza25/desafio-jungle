# TASK-04 — PixiJS and Asset Foundation

## Objective

Establish one well-owned PixiJS lifecycle and a recoverable asset-loading path inside the React Game screen.

## References

- `MASTER_SPEC.md`: TECH-003, ARCH-001–006, ASSET-001–007, LIFECYCLE-001–003
- `DESIGN_SYSTEM.md`: sections 2–6, 14–17 and 30–33
- Supplied gameplay assets, spritesheets and loading references
- `AGENTS.md`: sections 9–10 and 13–15

## Skills

- `pixijs`

## Scope

- Mount and destroy a PixiJS application through a narrow React integration boundary.
- Implement logical arena sizing, viewport resize and device-pixel-ratio handling.
- Create a typed asset manifest, load assets once where appropriate and expose visible progress.
- Handle load failures with a clear retry action.
- Render a minimal water arena from supplied assets to prove sizing, texture reuse and cleanup.

## Out of Scope

- Player controls, collision, weapons, enemies or match rules.
- Final arena composition and combat effects.
- Rendering state as the source of gameplay truth.

## Acceptance Criteria

- Only one Pixi application and ticker are active per Game instance.
- Combat cannot begin before required assets load successfully.
- Resize and DPR changes preserve logical coordinates and avoid unintended clipping.
- Failed loading is visible and retryable; teardown releases owned Pixi resources and listeners.
- Strict Mode remounting does not create duplicate canvases or loops.

## Validation

- Run `typecheck`, `lint`, asset-loading tests and `build`.
- Exercise success, failure and retry paths.
- Mount, unmount and remount Game repeatedly; verify one canvas/ticker and no unhandled console errors.
