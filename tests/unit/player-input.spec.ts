import { expect, test } from '@playwright/test';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import { GameController } from '../../src/game/core/GameController';
import { SIMULATION_TIMING } from '../../src/game/core/FixedStepClock';
import { InputState } from '../../src/game/input/InputState';
import type { GameplayAction } from '../../src/game/input/InputState';
import { keyboardAction, KeyboardActions } from '../../src/game/input/KeyboardActions';

function start() {
  const game = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG });
  game.markReady(); game.start(); game.advance(0);
  return game;
}

function advance(game: GameController, totalMs: number, updateMs = 1000 / 60) {
  for (let delivered = 0; delivered < totalMs;) {
    const delta = Math.min(updateMs, totalMs - delivered);
    game.advance(delta);
    delivered += delta;
  }
}

test('documented keyboard bindings feed shared actions, including all attacks and pause', () => {
  const input = new InputState();
  const keys = new KeyboardActions(input);
  const mappings: [string, GameplayAction][] = [
    ['KeyW', 'moveForward'], ['ArrowUp', 'moveForward'], ['KeyA', 'turnLeft'], ['ArrowLeft', 'turnLeft'],
    ['KeyD', 'turnRight'], ['ArrowRight', 'turnRight'], ['Space', 'fireFront'],
    ['KeyQ', 'fireLeft'], ['KeyE', 'fireRight'], ['Escape', 'pause'],
  ];
  for (const [code, action] of mappings) {
    expect(keyboardAction(code)).toBe(action);
    keys.press(code, false); expect(input.isHeld(action)).toBe(true);
    keys.release(code); expect(input.isHeld(action)).toBe(false);
  }
  expect(keyboardAction('Tab')).toBeUndefined();
  expect(keyboardAction('constructor')).toBeUndefined();
  keys.press('Tab', false);
  for (const [, action] of mappings) expect(input.isHeld(action)).toBe(false);
});

test('aliases, simultaneous actions and stale key repeats cannot lose or stick input', () => {
  const input = new InputState();
  const keys = new KeyboardActions(input);
  keys.press('KeyW', false); keys.press('ArrowUp', false); keys.press('KeyD', false); keys.press('Space', false);
  keys.release('KeyW');
  expect(input.isHeld('moveForward')).toBe(true);
  expect(input.isHeld('turnRight')).toBe(true);
  expect(input.isHeld('fireFront')).toBe(true);
  keys.release('ArrowUp'); expect(input.isHeld('moveForward')).toBe(false);
  keys.clear();
  keys.press('KeyD', true); keys.press('Space', true);
  expect(input.isHeld('turnRight')).toBe(false);
  expect(input.isHeld('fireFront')).toBe(false);
  keys.release('KeyD'); keys.press('KeyD', false);
  expect(input.isHeld('turnRight')).toBe(true);
});

test('a quick pause tap survives release until consumed, and clearing cancels the request', () => {
  const game = start();
  const keys = new KeyboardActions(game.input);
  keys.press('Escape', false); keys.release('Escape');
  expect(game.input.isHeld('pause')).toBe(false);
  game.advance(1);
  expect(game.getSnapshot().state).toBe('paused');
  expect(game.input.takePauseRequest()).toBe(false);
  game.resume(); game.advance(0);
  keys.press('Escape', false); keys.release('Escape'); keys.clear();
  game.advance(100);
  expect(game.getSnapshot().state).toBe('running');
});

test('player starts centered with configured health, moves forward, and exposes immutable reads', () => {
  const game = start();
  const initial = game.getPlayerState();
  expect(initial).toEqual({ x: 640, y: 360, rotation: 0, health: DEFAULT_GAME_CONFIG.player.health });
  if (!initial) throw new Error('Missing player.');
  expect(Reflect.set(initial, 'x', 0)).toBe(false);
  game.input.set('moveForward', true);
  advance(game, 1000);
  expect(game.getPlayerState()?.x).toBe(640);
  expect(game.getPlayerState()?.y).toBeCloseTo(360 - DEFAULT_GAME_CONFIG.player.movementSpeed, 9);
  expect(initial.y).toBe(360);
});

test('rotation uses configured speed, opposing turns cancel, and compatible motion is simultaneous', () => {
  for (const action of ['turnLeft', 'turnRight'] satisfies GameplayAction[]) {
    const game = start();
    game.input.set(action, true); advance(game, 1000);
    expect(game.getPlayerState()?.rotation).toBeCloseTo(action === 'turnLeft'
      ? Math.PI * 2 - DEFAULT_GAME_CONFIG.player.rotationSpeed : DEFAULT_GAME_CONFIG.player.rotationSpeed, 9);
    expect(game.getPlayerState()?.x).toBe(640);
  }
  const game = start();
  game.input.set('turnLeft', true); game.input.set('turnRight', true); game.input.set('moveForward', true);
  advance(game, 100);
  expect(game.getPlayerState()?.rotation).toBe(0);
  game.input.set('turnLeft', false); advance(game, 100);
  expect(game.getPlayerState()?.rotation).toBeCloseTo(0.25, 9);
  expect(game.getPlayerState()?.x).toBeGreaterThan(640);
  expect(game.getPlayerState()?.y).toBeLessThan(342);
});

test('equivalent active simulation time produces identical motion at 10–144 Hz', () => {
  const results = [];
  for (const delta of [100, 40, 1000 / 30, 1000 / 60, 1000 / 144]) {
    const game = start();
    game.input.set('moveForward', true); game.input.set('turnLeft', true);
    advance(game, 10_000, delta);
    results.push(game.getPlayerState());
  }
  for (const result of results) expect(result).toEqual(results[0]);
});

test('attack actions reach the weapon system without altering simultaneous player movement', () => {
  const game = start();
  const keys = new KeyboardActions(game.input);
  for (const code of ['Space', 'KeyQ', 'KeyE', 'KeyW']) keys.press(code, false);
  for (const action of ['fireFront', 'fireLeft', 'fireRight'] satisfies GameplayAction[]) expect(game.input.isHeld(action)).toBe(true);
  advance(game, 100);
  expect(game.getPlayerState()).toEqual({ x: 640, y: 342, rotation: 0, health: 100 });
  expect(Object.keys(game.getPlayerState() ?? {})).toEqual(['x', 'y', 'rotation', 'health']);
  expect(game.getProjectileStates()).toHaveLength(7);
});

test('pause action, explicit pause/resume, end, restart and destroy clear held input and motion', () => {
  for (const transition of ['pause', 'end', 'destroy'] as const) {
    const game = start();
    game.input.set('moveForward', true); game.input.set('fireLeft', true); advance(game, 100);
    game[transition]();
    const player = game.getPlayerState();
    expect(game.input.isHeld('moveForward')).toBe(false);
    expect(game.input.isHeld('fireLeft')).toBe(false);
    game.advance(60_000); expect(game.getPlayerState()).toEqual(player);
    if (transition === 'pause') {
      game.resume(); game.advance(60_000); advance(game, 100);
      expect(game.getPlayerState()).toEqual(player);
    }
  }
  const game = start();
  game.input.set('moveForward', true); game.input.set('pause', true); game.advance(100);
  expect(game.getSnapshot().state).toBe('paused');
  expect(game.getPlayerState()?.y).toBe(360);
  expect(game.input.isHeld('pause')).toBe(false);
  game.restart(); game.advance(0);
  game.input.set('turnRight', true); advance(game, 100);
  game.restart();
  expect(game.getPlayerState()).toEqual({ x: 640, y: 360, rotation: 0, health: 100 });
  expect(game.input.isHeld('turnRight')).toBe(false);
});

test('movement consumes bounded fixed deltas, config snapshots and never publishes per step', () => {
  const config = { ...DEFAULT_GAME_CONFIG, player: { health: 77, movementSpeed: 60, rotationSpeed: 1 } };
  const game = new GameController({ readConfig: () => config });
  let events = 0;
  game.subscribe(() => { events += 1; });
  game.markReady(); game.start(); game.advance(0);
  config.player.movementSpeed = 600;
  game.input.set('moveForward', true);
  game.advance(60_000);
  expect(game.getPlayerState()?.y).toBeCloseTo(360 - 60 * SIMULATION_TIMING.maxStepsPerFrame / 60, 9);
  expect(game.getPlayerState()?.health).toBe(77);
  advance(game, 1000);
  expect(events).toBe(3);
});
