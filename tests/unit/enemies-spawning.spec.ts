import { expect, test } from '@playwright/test';
import { DEFAULT_GAME_CONFIG as config } from '../../src/game/config/GameConfig';
import { ARENA_LAYOUT } from '../../src/game/config/arena';
import { createEnemy, damageEnemy } from '../../src/game/entities/Enemy';
import { createPlayer } from '../../src/game/entities/Player';
import { createSeededRandom } from '../../src/game/core/random';
import { GameController } from '../../src/game/core/GameController';
import { createWeaponState, fireWeapons } from '../../src/game/systems/fireWeapons';
import { updateEnemies } from '../../src/game/systems/updateEnemies';
import { updateProjectiles } from '../../src/game/systems/updateProjectiles';
import { spawnEnemies, validSpawn } from '../../src/game/systems/spawnEnemies';
import { InputState } from '../../src/game/input/InputState';

const player = () => createPlayer(config);
test('Chaser pursuit is deterministic, turns at configured rate, contacts once and is terminal', () => {
  const run = () => {
    const target = player(); const enemy = createEnemy(1, 'chaser', { x: 1000, y: 360 }, config);
    const weapons = createWeaponState();
    for (let step = 0; step < 1200; step++) updateEnemies([enemy], target, config, 1 / 60, step / 60, weapons, ARENA_LAYOUT);
    expect(target.health).toBe(75); expect(enemy.destroyed).toBe(true);
    const terminal = { ...enemy };
    updateEnemies([enemy], target, config, 10, 100, weapons, ARENA_LAYOUT);
    expect(damageEnemy(enemy, 100)).toBe(false); expect(enemy).toEqual(terminal);
    return { enemy, target };
  };
  expect(run()).toEqual(run());
  const enemy = createEnemy(1, 'chaser', { x: 1000, y: 360 }, config);
  updateEnemies([enemy], player(), config, 1 / 60, 0, createWeaponState(), ARENA_LAYOUT);
  expect(enemy.rotation).toBeCloseTo(Math.PI * 2 - config.chaser.rotationSpeed / 60);
});

test('Shooter approaches, stops in range, fires toward player with exact simulation cooldown', () => {
  const target = player(); const weapons = createWeaponState();
  const enemy = createEnemy(1, 'shooter', { x: 1100, y: 360 }, config); enemy.rotation = Math.PI * 1.5;
  expect(updateEnemies([enemy], target, config, 1 / 60, 0, weapons, ARENA_LAYOUT)).toEqual([]);
  expect(enemy.x).toBeLessThan(1100);
  enemy.x = 950; const before = { x: enemy.x, y: enemy.y };
  const shots = updateEnemies([enemy], target, config, 1 / 60, 1, weapons, ARENA_LAYOUT);
  expect(shots).toHaveLength(1); expect(shots[0].directionX).toBe(-1); expect(shots[0].directionY).toBe(0);
  expect({ x: enemy.x, y: enemy.y }).toEqual(before);
  expect(updateEnemies([enemy], target, config, 1 / 60, 2.99, weapons, ARENA_LAYOUT)).toEqual([]);
  expect(updateEnemies([enemy], target, config, 1 / 60, 3, weapons, ARENA_LAYOUT)).toHaveLength(1);
  expect(updateProjectiles(shots, 1, ARENA_LAYOUT, [enemy], target)).toEqual([]);
  expect(target.health).toBe(75); expect(shots[0].resolution).toBe('target');
  const terminal = { ...shots[0] }; updateProjectiles(shots, 1, ARENA_LAYOUT, [enemy], target);
  expect(target.health).toBe(75); expect(shots[0]).toEqual(terminal);
});

test('real player actions fire projectiles that damage and destroy enemies once; dead targets are excluded', () => {
  const target = player(); const enemy = createEnemy(1, 'chaser', { x: 640, y: 140 }, config);
  const input = new InputState(); input.set('fireFront', true); const weapons = createWeaponState();
  for (const seconds of [0, 0.5]) {
    const shots = fireWeapons(target, input, config, weapons, seconds);
    expect(updateProjectiles(shots, 0.5, ARENA_LAYOUT, [enemy], target)).toEqual([]);
    expect(shots[0].resolution).toBe('target');
    updateProjectiles(shots, 10, ARENA_LAYOUT, [enemy], target);
  }
  expect(enemy.health).toBe(0); expect(enemy.destroyed).toBe(true);
  const shots = fireWeapons(target, input, config, weapons, 1);
  expect(updateProjectiles(shots, 0.5, ARENA_LAYOUT, [enemy], target)).toHaveLength(1);
  expect(enemy.health).toBe(0);
});

test('seeded bounded spawning respects bounds, islands, safe distance and both distributions', () => {
  const run = (seed: number) => {
    const random = createSeededRandom(seed); const state = { nextAtSeconds: 3, nextEnemyId: 1 }; const target = player();
    const enemies = Array.from({ length: 40 }, (_, index) => spawnEnemies(state, (index + 1) * 3, target, config, random, ARENA_LAYOUT)).flat();
    expect(enemies.length).toBeGreaterThan(30);
    for (const enemy of enemies) expect(validSpawn(enemy, target, config, ARENA_LAYOUT)).toBe(true);
    expect(new Set(enemies.map((enemy) => enemy.kind)).size).toBe(2);
    return enemies;
  };
  const known = run(1);
  expect(known[0].kind).toBe('shooter');
  expect(known[0].x).toBeCloseTo(66 + 0.002735721180215478 * 1148, 10);
  expect(known[0].y).toBeCloseTo(66 + 0.5274470399599522 * 588, 10);
  expect(known).toEqual(run(1)); expect(run(42)).not.toEqual(known);
  for (const kind of ['chaser', 'shooter'] as const) {
    const custom = { ...config, spawn: { ...config.spawn, distribution: { chaser: kind === 'chaser' ? 1 : 0, shooter: kind === 'shooter' ? 1 : 0 } } };
    expect(spawnEnemies({ nextAtSeconds: 0, nextEnemyId: 1 }, 0, player(), custom, createSeededRandom(1), ARENA_LAYOUT)[0].kind).toBe(kind);
  }
  let calls = 0;
  expect(spawnEnemies({ nextAtSeconds: 0, nextEnemyId: 1 }, 0, player(), config, { next: () => { calls++; return 0.5; } }, ARENA_LAYOUT)).toEqual([]);
  expect(calls).toBe(1 + 2 * config.spawn.maxPositionAttempts);
  for (const point of [{ x: -1, y: 100 }, { x: 350, y: 320 }, player()]) expect(validSpawn(point, player(), config, ARENA_LAYOUT)).toBe(false);
});

test('enemy movement cannot cross island or arena boundaries even with large steps', () => {
  for (const kind of ['chaser', 'shooter'] as const) {
    const target = player(); target.x = 100; target.y = 320;
    const enemy = createEnemy(1, kind, { x: 600, y: 320 }, config); enemy.rotation = Math.PI * 1.5;
    updateEnemies([enemy], target, config, 10, 0, createWeaponState(), ARENA_LAYOUT);
    expect(enemy.x).toBeGreaterThanOrEqual(514);
    target.x = 2000; enemy.x = 1100; enemy.rotation = Math.PI / 2;
    updateEnemies([enemy], target, config, 10, 0, createWeaponState(), ARENA_LAYOUT);
    expect(enemy.x).toBeLessThanOrEqual(1214);
  }
});

test('controller pauses all enemy/combat/spawn state, resumes without debt and cleans up without per-step events', () => {
  const game = new GameController({ readConfig: () => config }); game.markReady(); game.start(); game.advance(0);
  let events = 0; game.subscribe(() => events++);
  const steps = (count: number) => { for (let i = 0; i < count; i++) game.advance(1000 / 60); };
  steps(720); expect(game.getEnemyStates().some(enemy => enemy.readyAtSeconds > game.getSnapshot().elapsedSeconds)).toBe(true); expect(game.getEnemyStates().length).toBeGreaterThan(0); expect(events).toBeGreaterThanOrEqual(13); expect(events).toBeLessThan(25);
  game.input.set('fireRight', true); steps(1);
  const state = () => ({ enemies: game.getEnemyStates(), projectiles: game.getProjectileStates(), player: game.getPlayerState(), seconds: game.getSnapshot().elapsedSeconds });
  const before = state(); game.pause(); game.advance(60000); expect(state()).toEqual(before);
  game.resume(); game.advance(60000); expect(state()).toEqual(before); steps(1); expect(state()).not.toEqual(before);
  expect(Object.isFrozen(game.getEnemyStates()[0])).toBe(true);
  game.end(); expect(game.getEnemyStates()).toEqual([]); expect(game.getProjectileStates()).toEqual([]);
  game.restart(); game.advance(0); steps(180); const spawned = game.getEnemyStates();
  game.restart(); game.advance(0); steps(180); expect(game.getEnemyStates()).toEqual(spawned);
  game.destroy(); steps(600); expect(game.getEnemyStates()).toEqual([]); expect(game.getProjectileStates()).toEqual([]);
});

test('enemy/spawn/combat state is independent of rendering delivery frequency and config changes', () => {
  const results = [];
  for (const milliseconds of [100, 1000 / 30, 1000 / 60, 1000 / 144]) {
    const mutable = { ...config, chaser: { ...config.chaser }, spawn: { ...config.spawn } };
    const game = new GameController({ readConfig: () => mutable, seed: 42 }); game.markReady(); game.start(); game.advance(0);
    mutable.chaser.movementSpeed = 999; mutable.spawn.intervalSeconds = 30;
    game.input.set('fireFront', true);
    for (let elapsed = 0; elapsed < 12000;) {
      const delta = Math.min(milliseconds, 12000 - elapsed); game.advance(delta); elapsed += delta;
    }
    results.push({ enemies: game.getEnemyStates(), shots: game.getProjectileStates(), player: game.getPlayerState() });
  }
  for (const result of results) expect(result).toEqual(results[0]);
});

test('earliest combat contact wins over distant obstacles; obstacles shield targets and dead enemies cannot absorb later shots', () => {
  const target = player(); const input = new InputState(); input.set('fireLeft', true);
  const shots = fireWeapons(target, input, config, createWeaponState(), 0);
  const enemy = createEnemy(1, 'chaser', { x: 530, y: 360 }, config);
  updateProjectiles(shots, 1, ARENA_LAYOUT, [enemy], target);
  expect(enemy.destroyed).toBe(true);
  expect(shots.filter(shot => shot.resolution === 'target')).toHaveLength(2);
  expect(shots.filter(shot => shot.resolution === 'island')).toHaveLength(1);
  const shielded = createEnemy(2, 'chaser', { x: 100, y: 360 }, config);
  const blocked = fireWeapons(target, input, config, createWeaponState(), 0);
  updateProjectiles(blocked, 2, ARENA_LAYOUT, [shielded], target);
  expect(shielded.health).toBe(50); expect(blocked.every(shot => shot.resolution === 'island')).toBe(true);
});
