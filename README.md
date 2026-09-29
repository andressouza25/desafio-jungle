# Pirate Battle

A 2D top-down naval shooter developed for the **Jungle Gaming Frontend Game Developer Challenge**.

The game is built with React, TypeScript and PixiJS and runs entirely in the browser.

Players navigate a naval arena, avoid islands, fight enemy ships and accumulate points until the match ends.

> This project is currently under development.

---

## Challenge

The objective is to build a complete browser-based naval shooter demonstrating:

- gameplay architecture;
- PixiJS rendering;
- React integration;
- TypeScript;
- responsive controls;
- remote state management;
- API mocking;
- automated testing;
- accessibility;
- performance awareness.

The implementation follows the requirements provided by Jungle Gaming in the original challenge specification.

The [original challenge specification](./docs/CHALLENGE.md) is preserved for reference. Its supplied assets are available under [`assets/`](./assets/).

---

## Tech Stack

### Core

- React
- TypeScript
- PixiJS

### Data

- TanStack Query
- Axios
- MSW

### Testing

- Playwright

Additional development tooling will be documented as the project setup evolves.

---

## Game Overview

Pirate Battle is a single-player naval combat game viewed from a top-down perspective.

The player controls a ship capable of:

- moving forward;
- rotating left and right;
- firing a frontal cannon;
- firing left and right broadsides.

The arena contains islands and enemy ships.

Two enemy types are required:

### Chaser

Pursues the player and causes damage by colliding with the player's ship.

### Shooter

Approaches the player and attacks from range.

Destroying enemies through player attacks awards points.

A match ends when:

- the configured match timer reaches zero; or
- the player's health reaches zero.

---

## Application

The project contains the following main experiences:

```text
Main Menu
├── Play
├── Options
├── Ranking
└── Match History

Game
├── Arena
├── HUD
├── Controls
└── Pause

Result
├── Match summary
├── Registration status
├── Play Again
└── Main Menu
```

---

## Architecture

The application separates web UI from the continuous game simulation.

```text
React
│
├── Menus
├── Options
├── Ranking
├── Match History
├── Result
└── Application UI

Game
│
├── Simulation
├── Input
├── Entities
├── Movement
├── Combat
├── Collision
├── Spawning
└── PixiJS Rendering

Data
│
├── TanStack Query
├── Axios
└── Persistence

Mock API
│
├── MSW
├── Fixtures
└── Network Scenarios
```

React is not used as the per-frame game engine.

Continuous gameplay state remains inside the game simulation, while PixiJS handles gameplay rendering.

See [`MASTER_SPEC.md`](./MASTER_SPEC.md) for the complete architectural rules.

---

## Project Documentation

Project decisions are separated across focused documents.

### `README.md`

Project overview, setup and usage documentation.

### `MASTER_SPEC.md`

Global architecture and implementation decisions.

### `DESIGN_SYSTEM.md`

Visual language, UI rules, responsive behavior and accessibility guidelines.

### `AGENTS.md`

Development rules and instructions for coding agents.

### `ARCHITECTURE.md`

Final documentation of the implemented architecture.

This file will evolve alongside the implementation.

### [`docs/TASKS.md`](./docs/TASKS.md)

Incremental implementation plan used during development.

---

## Assets

The challenge provides the visual and audio assets used as the foundation of the game.

Available assets include:

- ships;
- ship parts;
- islands and environment tiles;
- projectiles;
- explosions;
- fire effects;
- HUD elements;
- menu components;
- touch controls;
- spritesheets;
- sound effects;
- ambient audio.

Reference screens are also provided for:

- Main Menu;
- Options;
- Pause;
- Ranking;
- Match History;
- Result.

The project should preserve and extend the visual language of these supplied assets.

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## Gameplay Configuration

Gameplay balance is centralized in typed configuration.

This includes values such as:

- match duration;
- player health;
- movement speed;
- rotation speed;
- weapon cooldowns;
- projectile speed;
- projectile damage;
- enemy health;
- enemy speed;
- Shooter attack range;
- spawn interval;
- enemy distribution.

Each match receives a configuration snapshot when it starts.

---

## Ranking and Match History

Ranking and Match History are implemented through simulated REST APIs.

The data flow is:

```text
React
  ↓
TanStack Query
  ↓
Axios
  ↓
REST API
  ↓
MSW
```

The implementation supports the network and recovery scenarios required by the challenge, including idempotent match submission and pending submission recovery.

---

## Testing

Playwright is used for:

- end-to-end testing;
- gameplay flows;
- desktop testing;
- mobile testing;
- network failure scenarios;
- visual regression.

Gameplay testing is designed around deterministic simulation behavior where required.

---

## Performance

The game targets **60 FPS** in the documented reference environment.

Performance evaluation includes:

- frame rate;
- frame-time measurements;
- entity count;
- memory behavior;
- repeated game lifecycle testing.

Profiling results will be documented when the implementation reaches the performance validation stage.

---

## Development

The project is being implemented incrementally through small, isolated tasks.

Each task defines:

- objective;
- scope;
- relevant challenge requirements;
- acceptance criteria;
- validation;
- explicit out-of-scope work.

Coding agents must follow the repository instructions defined in [`AGENTS.md`](./AGENTS.md).

---

## Setup

Project setup instructions will be added after the initial project bootstrap is completed.

The final documentation will include commands for:

```text
development
build
preview
lint
typecheck
Playwright
```

---

## Controls

Final keyboard and touch mappings will be documented after the input system is implemented.

Required gameplay actions include:

| Action          | Keyboard | Touch     |
| --------------- | -------- | --------- |
| Move forward    | TBD      | Supported |
| Turn left       | TBD      | Supported |
| Turn right      | TBD      | Supported |
| Front fire      | TBD      | Supported |
| Left broadside  | TBD      | Supported |
| Right broadside | TBD      | Supported |
| Pause           | TBD      | Supported |

---

## Deployment

A public production deployment is required for the challenge.

Deployment instructions and the production URL will be added once the application reaches the deployment stage.

---

## Status

**Current phase:** Specification and architecture planning.

Current documentation:

- [x] Master Specification
- [x] Design System
- [x] Agent Instructions
- [x] Implementation Tasks
- [ ] Project Bootstrap
- [ ] Gameplay
- [ ] Ranking and Match History
- [ ] E2E Tests
- [ ] Performance Validation
- [ ] Deployment

---

## Development Principle

Prefer the simplest implementation that is correct, testable, maintainable and easy to explain.

The goal is not to maximize architectural complexity.

The goal is to deliver a complete game while demonstrating clear engineering decisions.
