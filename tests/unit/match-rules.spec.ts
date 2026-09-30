import { expect, test } from '@playwright/test';
import { DEFAULT_GAME_CONFIG as defaults } from '../../src/game/config/GameConfig';
import type { GameConfig } from '../../src/game/config/GameConfig';
import { GameController } from '../../src/game/core/GameController';
import { SIMULATION_TIMING } from '../../src/game/core/FixedStepClock';
import { parseResult, loadLastResult, saveLastResult } from '../../src/storage/lastResult';

function game(config: GameConfig, sequence = [0.5]) {
  let index = 0;
  const controller = new GameController({ readConfig: () => config, createRandom: () => ({ next: () => sequence[index++ % sequence.length] }) });
  controller.markReady(); controller.start(); controller.advance(0); return controller;
}
function steps(controller: GameController, count: number) { for (let i = 0; i < count; i++) controller.advance(SIMULATION_TIMING.stepMs); }
const timeoutConfig = { ...defaults, session: { durationSeconds: 60 } };

test('timeout resolves once, uses active simulation time, freezes all state and restarts cleanly', () => {
  const controller = game(timeoutConfig);
  let ends = 0; controller.subscribe(snapshot => { if (snapshot.result) ends++; });
  steps(controller, 60); controller.pause(); controller.advance(60000);
  expect(controller.getSnapshot().remainingSeconds).toBe(59);
  controller.resume(); controller.advance(0); steps(controller, 3538);
  // Cross the deadline inside a multiple-step delivery: the clock must stop on that step.
  controller.advance(100);
  const ended = controller.getSnapshot();
  expect(ended.result).toEqual({ score: 0, durationSeconds: expect.closeTo(60, 8), reason: 'timeout' });
  expect(Object.isFrozen(ended.result)).toBe(true); expect(ends).toBe(1);
  const player = controller.getPlayerState();
  controller.input.set('moveForward', true); controller.input.set('fireFront', true);
  controller.advance(1000); controller.end('player-death'); controller.resume();
  expect(controller.getSnapshot()).toEqual(ended); expect(controller.getPlayerState()).toEqual(player);
  expect(controller.getProjectileStates()).toEqual([]); expect(controller.getEnemyStates()).toEqual([]);
  controller.restart();
  expect(controller.getSnapshot()).toMatchObject({ score: 0, playerHealth: 100, elapsedSeconds: 0, remainingSeconds: 60, result: null, state: 'running' });
  expect(controller.input.isHeld('moveForward')).toBe(false);
});

test('real player projectiles award exactly one point per kill, despite repeated fire', () => {
  const controller = game({ ...defaults, shooter: { ...defaults.shooter, health: 25 }, spawn: { ...defaults.spawn, minimumPlayerDistance: 100 } }, [0.9, 0.5, 0]);
  steps(controller, 180); expect(controller.getEnemyStates()).toHaveLength(1);
  controller.input.set('fireFront', true); steps(controller, 100);
  expect(controller.getSnapshot().score).toBe(1); expect(controller.getEnemyStates()).toEqual([]);
  steps(controller, 10); expect(controller.getSnapshot().score).toBe(1);
});

test('Chaser contact kills once, gives zero score and freezes remaining fixed steps', () => {
  const controller = game({ ...defaults, player: { ...defaults.player, health: 25 }, chaser: { ...defaults.chaser, movementSpeed: 1000, rotationSpeed: 100 }, spawn: { ...defaults.spawn, intervalSeconds: 1 } }, [0, 0.99, 0.5]);
  let ends = 0; controller.subscribe(snapshot => { if (snapshot.result) ends++; });
  steps(controller, 200);
  expect(controller.getSnapshot()).toMatchObject({ state: 'ended', score: 0, playerHealth: 0, endReason: 'player-death' });
  expect(controller.getSnapshot().result?.durationSeconds).toBeLessThan(3);
  expect(ends).toBe(1); const ended = controller.getSnapshot();
  controller.advance(100); expect(controller.getSnapshot()).toEqual(ended);
});

test('HUD publishes seconds and combat changes, never continuous transforms or fractional time', () => {
  const controller = game(timeoutConfig); const snapshots = [controller.getSnapshot()];
  controller.subscribe(snapshot => snapshots.push(snapshot));
  controller.input.set('turnRight', true); steps(controller, 600);
  expect(snapshots).toHaveLength(12); // Initial read, subscription, ten displayed-second changes.
  expect(snapshots.at(-1)?.remainingSeconds).toBe(50);
  for (let i = 2; i < snapshots.length; i++) expect(snapshots[i].remainingSeconds).toBe(snapshots[i - 1].remainingSeconds - 1);
});

test('last result validates storage, survives fresh reads and tolerates unavailable storage', () => {
  const entries = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) } });
  try {
    const result = { score: 3, durationSeconds: 12.5, reason: 'player-death' } as const;
    expect(saveLastResult(result)).toBe(true); expect(loadLastResult()).toEqual(result); expect(Object.isFrozen(loadLastResult())).toBe(true);
    for (const invalid of [null, {}, { ...result, score: -1 }, { ...result, reason: 'abandoned' }, { ...result, durationSeconds: Infinity }]) expect(parseResult(invalid)).toBeNull();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Unavailable'); } });
    expect(loadLastResult()).toBeNull(); expect(saveLastResult(result)).toBe(false);
  } finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});

test('death and timeout in the same step resolve one result with deterministic death priority', () => {
  let seconds = 0;
  const controller = new GameController({
    readConfig: () => ({ ...defaults, session: { durationSeconds: 60 }, player: { ...defaults.player, health: 25 },
      chaser: { ...defaults.chaser, movementSpeed: 100000, rotationSpeed: 1000 } }),
    createRandom: () => { let i = 0; const sequence = [0, 0.99, 0.5]; return { next: () => sequence[i++ % 3] }; },
    clock: {
      get elapsedSeconds() { return seconds; },
      reset() { seconds = 0; }, rebase() {},
      advance(_ms, onStep) { seconds = seconds === 0 ? 60 - 1 / 60 : 60; onStep?.(1 / 60); return 1; },
    },
  });
  controller.markReady(); controller.start();
  let results = 0; controller.subscribe(snapshot => { if (snapshot.result) results++; });
  controller.advance(17); // Safe seeded spawn on the preceding step.
  controller.advance(17); // Real Chaser contact and the deadline coincide.
  expect(controller.getSnapshot().result).toEqual({ reason: 'player-death', score: 0, durationSeconds: 60 });
  expect(results).toBe(1);
  controller.end('timeout'); controller.advance(1000); expect(results).toBe(1);
});
