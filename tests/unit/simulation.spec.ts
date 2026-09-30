import { expect, test } from '@playwright/test';
import { DEFAULT_GAME_CONFIG, snapshotGameConfig } from '../../src/game/config/GameConfig';
import { FixedStepClock, SIMULATION_TIMING } from '../../src/game/core/FixedStepClock';
import type { SimulationClock } from '../../src/game/core/FixedStepClock';
import { GameController } from '../../src/game/core/GameController';
import { createSeededRandom } from '../../src/game/core/random';
import type { LifecycleState } from '../../src/game/GameSession';

function advanceTotal(clock: FixedStepClock, updateMs: number, totalMs: number) {
  clock.advance(0); // Establish the delivery baseline, not simulation time.
  let delivered = 0;
  let steps = 0;
  while (delivered < totalMs) {
    const delta = Math.min(updateMs, totalMs - delivered);
    steps += clock.advance(delta);
    delivered += delta;
  }
  return steps;
}

function controller() { return new GameController({ readConfig: () => DEFAULT_GAME_CONFIG }); }
function start(game: GameController) { game.markReady(); game.start(); game.advance(0); }

test('equal elapsed input at 10–144 Hz produces the same fixed-step time', () => {
  for (const delta of [100, 40, 20, 1000 / 30, 1000 / 60, 1000 / 144]) {
    const clock = new FixedStepClock();
    expect(advanceTotal(clock, delta, 10_000)).toBe(600);
    expect(clock.elapsedSeconds).toBeCloseTo(10, 9);
  }
});

test('partial elapsed inputs accumulate into fixed steps, not rendering frames', () => {
  const clock = new FixedStepClock();
  clock.advance(0);
  expect(clock.advance(5)).toBe(0);
  expect(clock.advance(5)).toBe(0);
  expect(clock.advance(7)).toBe(1);
  expect(clock.elapsedSeconds).toBeCloseTo(1 / 60, 12);
  expect(clock.advance(0)).toBe(0);
  expect(clock.advance(50)).toBe(3);
  expect(clock.elapsedSeconds).toBeCloseTo(4 / 60, 12);
});

test('large gaps are clamped, catch-up is bounded and no whole-step debt survives', () => {
  const clock = new FixedStepClock();
  clock.advance(0);
  expect(clock.advance(60_000)).toBe(SIMULATION_TIMING.maxStepsPerFrame);
  expect(clock.elapsedSeconds).toBeCloseTo(8 / 60, 12);
  expect(clock.advance(0)).toBe(0);
  expect(clock.advance(SIMULATION_TIMING.stepMs)).toBe(1);
});

test('invalid elapsed deliveries cannot poison the accumulator or baseline', () => {
  const clock = new FixedStepClock();
  for (const delta of [NaN, Infinity, -100]) expect(clock.advance(delta)).toBe(0);
  expect(clock.advance(60_000)).toBe(0);
  for (const delta of [NaN, Infinity, -100]) expect(clock.advance(delta)).toBe(0);
  expect(clock.advance(SIMULATION_TIMING.stepMs)).toBe(1);
  expect(clock.elapsedSeconds).toBeCloseTo(1 / 60, 12);
});

test('loading cannot start and repeated or invalid transitions do nothing', () => {
  const game = controller();
  game.start(); game.resume(); game.pause(); game.restart(); game.end(); game.advance(1000);
  expect(game.getSnapshot().state).toBe('loading');
  expect(game.getSnapshot().config).toBeNull();
  const events: LifecycleState[] = [];
  game.subscribe((snapshot) => events.push(snapshot.state));
  game.markReady(); game.markReady(); game.pause(); game.resume(); game.end();
  game.start(); game.start(); game.resume();
  expect(events).toEqual(['loading', 'ready', 'running']);
  expect(game.getSnapshot().elapsedSeconds).toBe(0);
});

test('start, pause, resume, end, restart and destroy publish typed lifecycle changes only', () => {
  const game = controller();
  const events: LifecycleState[] = [];
  game.subscribe((snapshot) => events.push(snapshot.state));
  start(game);
  game.advance(100);
  game.pause(); game.resume(); game.advance(0); game.advance(100); game.end();
  const ended = game.getSnapshot();
  game.advance(1000); game.end(); game.resume(); game.start();
  expect(game.getSnapshot()).toEqual(ended);
  expect(ended.endReason).toBe('manual');
  game.restart();
  expect(game.getSnapshot().elapsedSeconds).toBe(0);
  expect(game.getSnapshot().endReason).toBeNull();
  game.destroy(); game.destroy();
  expect(events).toEqual(['loading', 'ready', 'running', 'paused', 'running', 'ended', 'running', 'ended']);
  expect(game.getSnapshot().destroyed).toBe(true);
});

test('paused and hidden-tab time cannot advance the simulation or jump on resume', () => {
  const game = controller();
  start(game);
  game.advance(100);
  game.advance(5); // A sub-step must not be carried across the pause boundary.
  game.pause();
  const paused = game.getSnapshot().elapsedSeconds;
  game.advance(60_000); game.advance(1000);
  expect(game.getSnapshot().elapsedSeconds).toBe(paused);
  game.resume();
  game.advance(60_000); // A stale first delivery after resume is discarded, not clamped.
  expect(game.getSnapshot().elapsedSeconds).toBe(paused);
  game.advance(12);
  expect(game.getSnapshot().elapsedSeconds).toBe(paused);
  game.advance(5);
  expect(game.getSnapshot().elapsedSeconds).toBeCloseTo(paused + 1 / 60, 12);
});

test('destroy is terminal, idempotent and safe before loading completes', () => {
  for (const active of [false, true]) {
    const game = controller();
    if (active) { start(game); game.advance(100); }
    game.destroy();
    const terminal = game.getSnapshot();
    game.destroy(); game.markReady(); game.start(); game.resume(); game.restart(); game.end(); game.advance(1000);
    expect(game.getSnapshot()).toEqual(terminal);
    expect(game.random).toBeNull();
    let notified = false;
    game.subscribe(() => { notified = true; });
    expect(notified).toBe(false);
  }
});

test('configuration is read at start, deeply copied, frozen and refreshed on restart', () => {
  const supplied = { ...DEFAULT_GAME_CONFIG, session: { durationSeconds: 120 }, player: { ...DEFAULT_GAME_CONFIG.player },
    weapons: { ...DEFAULT_GAME_CONFIG.weapons, front: { cooldownSeconds: 0.5 } },
    spawn: { ...DEFAULT_GAME_CONFIG.spawn, distribution: { chaser: 0.5, shooter: 0.5 } } };
  const game = new GameController({ readConfig: () => supplied });
  game.markReady();
  supplied.session.durationSeconds = 150; // Options changed after creation, before start.
  game.start();
  const active = game.getSnapshot().config;
  expect(active).not.toBeNull();
  supplied.session.durationSeconds = 60;
  supplied.player.health = 12;
  supplied.weapons.front.cooldownSeconds = 3;
  supplied.spawn.distribution.chaser = 0.7;
  supplied.spawn.distribution.shooter = 0.3;
  expect(active?.session.durationSeconds).toBe(150);
  expect(active?.player.health).toBe(100);
  expect(active?.weapons.front.cooldownSeconds).toBe(0.5);
  expect(active?.spawn.distribution.chaser).toBe(0.5);
  for (const object of [active, active?.session, active?.player, active?.weapons, active?.weapons.front,
    active?.projectiles, active?.chaser, active?.shooter, active?.spawn, active?.spawn.distribution]) {
    expect(Object.isFrozen(object)).toBe(true);
  }
  if (!active) throw new Error('Expected a configuration snapshot.');
  expect(Reflect.set(active.player, 'health', 99)).toBe(false);
  game.restart();
  expect(game.getSnapshot().config).not.toBe(active);
  expect(game.getSnapshot().config?.session.durationSeconds).toBe(60);
  expect(game.getSnapshot().config?.player.health).toBe(12);
});

test('invalid configuration is reported before a match can run', () => {
  for (const durationSeconds of [0, 59, 181, NaN]) {
    expect(() => snapshotGameConfig({ ...DEFAULT_GAME_CONFIG, session: { durationSeconds } })).toThrow(RangeError);
  }
  expect(() => snapshotGameConfig({ ...DEFAULT_GAME_CONFIG, spawn: { ...DEFAULT_GAME_CONFIG.spawn, intervalSeconds: 0, distribution: { chaser: 0.5, shooter: 0.5 } } })).toThrow(RangeError);
  const game = new GameController({ readConfig: () => ({ ...DEFAULT_GAME_CONFIG, player: { ...DEFAULT_GAME_CONFIG.player, health: 0 } }) });
  game.markReady();
  expect(() => game.start()).toThrow(RangeError);
  expect(game.getSnapshot().state).toBe('ready');
  expect(game.getSnapshot().config).toBeNull();
});

test('seeded randomness is reproducible, bounded and different for different seeds', () => {
  const first = createSeededRandom(42);
  const second = createSeededRandom(42);
  const third = createSeededRandom(43);
  const sequence = Array.from({ length: 100 }, () => first.next());
  expect(sequence).toEqual(Array.from({ length: 100 }, () => second.next()));
  expect(sequence).not.toEqual(Array.from({ length: 100 }, () => third.next()));
  for (const value of sequence) { expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThan(1); }
  expect(() => createSeededRandom(NaN)).toThrow(RangeError);
});

test('restart resets elapsed time, accumulator and random sequence, including from running', () => {
  const game = controller();
  start(game);
  const first = game.random?.next();
  game.random?.next(); game.advance(105);
  game.restart();
  expect(game.getSnapshot().elapsedSeconds).toBe(0);
  expect(game.random?.next()).toBe(first);
  game.advance(60_000);
  game.advance(12);
  expect(game.getSnapshot().elapsedSeconds).toBe(0);
});

test('clock and random source can be injected without browser or Pixi dependencies', () => {
  const delegate = new FixedStepClock();
  const deliveries: number[] = [];
  const clock: SimulationClock = {
    get elapsedSeconds() { return delegate.elapsedSeconds; },
    advance(ms, onStep) { deliveries.push(ms); return delegate.advance(ms, onStep); },
    rebase() { delegate.rebase(); }, reset() { delegate.reset(); },
  };
  const seeds: number[] = [];
  const game = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG, clock, seed: 42,
    createRandom: (seed) => { seeds.push(seed); return { next: () => 0.25 }; } });
  start(game); game.advance(100); game.pause(); game.advance(60_000);
  expect(deliveries).toEqual([0, 100]);
  expect(game.random?.next()).toBe(0.25);
  game.restart();
  expect(seeds).toEqual([42, 42]);
  expect(game.getSnapshot().elapsedSeconds).toBe(0);
});

test('simulation publishes semantic HUD changes; unsubscription releases listeners', () => {
  const game = controller();
  let events = 0;
  const unsubscribe = game.subscribe(() => { events += 1; });
  start(game);
  expect(events).toBe(3);
  for (let update = 0; update < 1000; update += 1) game.advance(10);
  expect(game.getSnapshot().elapsedSeconds).toBeCloseTo(10, 9);
  expect(events).toBeGreaterThanOrEqual(13);
  expect(events).toBeLessThan(20);
  const published = events;
  unsubscribe(); game.pause(); game.end(); game.destroy();
  expect(events).toBe(published);
});

test('the same configuration and seed produce identical snapshots across update frequencies', () => {
  const snapshots = [];
  const sequences = [];
  for (const delta of [10, 40, 100]) {
    const game = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG, seed: 42 });
    start(game);
    for (let delivered = 0; delivered < 1000; delivered += delta) game.advance(delta);
    game.pause();
    snapshots.push(game.getSnapshot());
    sequences.push(Array.from({ length: 20 }, () => game.random?.next()));
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
  expect(sequences[1]).toEqual(sequences[0]);
  expect(sequences[2]).toEqual(sequences[0]);
});
