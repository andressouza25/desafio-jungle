import { expect, test } from '@playwright/test';
import { ARENA_LAYOUT, PLAYER_COLLIDER_HALF_SIZE as halfSize } from '../../src/game/config/arena';
import type { WorldPoint } from '../../src/game/config/arena';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import { GameController } from '../../src/game/core/GameController';
import { SIMULATION_TIMING } from '../../src/game/core/FixedStepClock';
import { createPlayer } from '../../src/game/entities/Player';
import { InputState } from '../../src/game/input/InputState';
import { containsPoint, expandRectangle, resolveArenaMovement, sweepPointAgainstRectangle } from '../../src/game/systems/collision';
import { movePlayer } from '../../src/game/systems/movePlayer';

const island = ARENA_LAYOUT.islands[0];
const forbidden = expandRectangle(island, halfSize);

function expectValid(point: WorldPoint) {
  expect(point.x).toBeGreaterThanOrEqual(halfSize);
  expect(point.x).toBeLessThanOrEqual(1280 - halfSize);
  expect(point.y).toBeGreaterThanOrEqual(halfSize);
  expect(point.y).toBeLessThanOrEqual(720 - halfSize);
  expect(containsPoint(forbidden, point)).toBe(false);
}

test('world geometry is deeply immutable, and the player footprint contains artwork at all rotations', () => {
  expect(Object.isFrozen(ARENA_LAYOUT)).toBe(true);
  expect(Object.isFrozen(ARENA_LAYOUT.bounds)).toBe(true);
  expect(Object.isFrozen(ARENA_LAYOUT.islands)).toBe(true);
  expect(Object.isFrozen(island)).toBe(true);
  for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
    expect(Math.abs(Math.cos(angle)) * 33 + Math.abs(Math.sin(angle)) * 56.5).toBeLessThan(halfSize);
    expect(Math.abs(Math.sin(angle)) * 33 + Math.abs(Math.cos(angle)) * 56.5).toBeLessThan(halfSize);
  }
});

test('every edge and corner stops the complete footprint, including endpoint crossings', () => {
  const from = { x: 800, y: 360 };
  for (const proposed of [{ x: 800, y: -500 }, { x: 800, y: 2000 }, { x: 2000, y: 360 },
    { x: -500, y: 100 }, { x: 2000, y: -500 }, { x: 2000, y: 2000 }]) {
    const resolved = resolveArenaMovement(from, proposed, halfSize, ARENA_LAYOUT);
    expectValid(resolved);
  }
  expect(resolveArenaMovement({ x: 100, y: 100 }, { x: -500, y: 100 }, halfSize, ARENA_LAYOUT).x).toBe(halfSize);
  expect(resolveArenaMovement(from, { x: 2000, y: 360 }, halfSize, ARENA_LAYOUT).x).toBe(1214);
  expect(resolveArenaMovement(from, { x: 800, y: -500 }, halfSize, ARENA_LAYOUT).y).toBe(66);
  expect(resolveArenaMovement(from, { x: 800, y: 2000 }, halfSize, ARENA_LAYOUT).y).toBe(654);
});

test('all island sides and diagonal approaches block even when the endpoint lies beyond the island', () => {
  const approaches = [
    [{ x: 100, y: 320 }, { x: 700, y: 320 }],
    [{ x: 700, y: 320 }, { x: 100, y: 320 }],
    [{ x: 350, y: 100 }, { x: 350, y: 600 }],
    [{ x: 350, y: 600 }, { x: 350, y: 100 }],
    [{ x: 100, y: 100 }, { x: 700, y: 600 }],
    [{ x: 700, y: 100 }, { x: 100, y: 600 }],
    [{ x: 100, y: 600 }, { x: 700, y: 100 }],
    [{ x: 700, y: 600 }, { x: 100, y: 100 }],
  ];
  for (const [from, to] of approaches) {
    const resolved = resolveArenaMovement(from, to, halfSize, ARENA_LAYOUT);
    expectValid(resolved);
    expect(resolved).not.toEqual(to);
    expect(resolveArenaMovement(from, to, halfSize, ARENA_LAYOUT)).toEqual(resolved);
  }
});

test('reusable point sweep handles tangency, zero displacement, contact and escape', () => {
  const rectangle = { x: 10, y: 10, width: 20, height: 20 };
  expect(sweepPointAgainstRectangle({ x: 0, y: 20 }, { x: 40, y: 20 }, rectangle)).toBe(0.25);
  expect(sweepPointAgainstRectangle({ x: 40, y: 20 }, { x: 0, y: 20 }, rectangle)).toBe(0.25);
  expect(sweepPointAgainstRectangle({ x: 0, y: 10 }, { x: 40, y: 10 }, rectangle)).toBeNull();
  expect(sweepPointAgainstRectangle({ x: 10, y: 20 }, { x: 10, y: 25 }, rectangle)).toBeNull();
  expect(sweepPointAgainstRectangle({ x: 10, y: 20 }, { x: 0, y: 20 }, rectangle)).toBeNull();
  expect(sweepPointAgainstRectangle({ x: 10, y: 20 }, { x: 20, y: 20 }, rectangle)).toBe(0);
  expect(sweepPointAgainstRectangle({ x: 0, y: 20 }, { x: 10, y: 20 }, rectangle)).toBeNull();
  expect(sweepPointAgainstRectangle({ x: 0, y: 20 }, { x: 0, y: 20 }, rectangle)).toBeNull();
  expect(containsPoint(rectangle, { x: 20, y: 20 })).toBe(true);
  expect(containsPoint(rectangle, { x: 10, y: 20 })).toBe(false);
});

test('earliest collision wins regardless of obstacle order, and queries do not mutate inputs', () => {
  const near = { x: 250, y: 100, width: 50, height: 50 };
  const far = { x: 400, y: 100, width: 50, height: 50 };
  const from = Object.freeze({ x: 100, y: 125 });
  const proposed = Object.freeze({ x: 800, y: 125 });
  const resolve = (islands: readonly typeof near[]) => resolveArenaMovement(from, proposed, 10,
    { bounds: ARENA_LAYOUT.bounds, islands });
  expect(resolve([near, far])).toEqual(resolve([far, near]));
  expect(resolve([near, far]).x).toBeCloseTo(240, 6);
  expect(from).toEqual({ x: 100, y: 125 });
  expect(proposed).toEqual({ x: 800, y: 125 });
});

test('free movement retains TASK-06 rotation-first behavior exactly', () => {
  const player = createPlayer(DEFAULT_GAME_CONFIG);
  const input = new InputState(); input.set('moveForward', true); input.set('turnRight', true);
  const delta = SIMULATION_TIMING.stepMs / 1000;
  const rotation = ((DEFAULT_GAME_CONFIG.player.rotationSpeed * delta) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  movePlayer(player, input, DEFAULT_GAME_CONFIG, delta);
  expect(player).toEqual({ x: 640 + Math.sin(rotation) * 180 * delta,
    y: 360 - Math.cos(rotation) * 180 * delta, rotation, health: 100 });
});

test('movement and rotation stay valid at obstacles and edges, then can escape contact', () => {
  for (const initial of [{ x: 514, y: 320, rotation: Math.PI * 1.5 }, { x: 640, y: 66, rotation: 0 }]) {
    const player = { ...initial, health: 100 };
    const input = new InputState(); input.set('moveForward', true); input.set('turnRight', true);
    for (let step = 0; step < 300; step += 1) {
      movePlayer(player, input, DEFAULT_GAME_CONFIG, 1 / 60);
      expectValid(player);
    }
    expect(player.rotation).not.toBe(initial.rotation);
    expect({ x: player.x, y: player.y }).not.toEqual({ x: initial.x, y: initial.y });
  }
});

test('configured high speed cannot tunnel during one allowed fixed step or a capped frame gap', () => {
  const config = { ...DEFAULT_GAME_CONFIG, player: { ...DEFAULT_GAME_CONFIG.player, movementSpeed: 60000 } };
  const player = { x: 640, y: 360, rotation: Math.PI * 1.5, health: 100 };
  const input = new InputState(); input.set('moveForward', true);
  movePlayer(player, input, config, 1 / 60);
  expectValid(player); expect(player.x).toBeCloseTo(514, 6);
  const game = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG });
  game.markReady(); game.start(); game.advance(0); game.input.set('moveForward', true);
  for (let step = 0; step < 96; step += 1) game.advance(1000 / 60);
  game.advance(60000);
  expect(game.getPlayerState()?.y).toBe(66);
});

test('collision through actions and fixed simulation is equivalent at 10–144 Hz, with clean restart', () => {
  const results = [];
  for (const updateMs of [100, 40, 1000 / 30, 1000 / 60, 1000 / 144]) {
    const game = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG });
    game.markReady(); game.start(); game.advance(0); game.input.set('moveForward', true);
    for (let delivered = 0; delivered < 5000;) {
      const delta = Math.min(updateMs, 5000 - delivered); game.advance(delta); delivered += delta;
    }
    results.push(game.getPlayerState());
    game.restart();
    expect(game.getPlayerState()).toEqual(createPlayer(DEFAULT_GAME_CONFIG));
  }
  for (const result of results) expect(result).toEqual(results[0]);
  expect(results[0]?.y).toBe(66);
});
