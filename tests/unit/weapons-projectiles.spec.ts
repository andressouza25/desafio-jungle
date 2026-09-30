import { expect, test } from '@playwright/test';
import { ARENA_LAYOUT } from '../../src/game/config/arena';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import type { GameConfig, WeaponId } from '../../src/game/config/GameConfig';
import { GameController } from '../../src/game/core/GameController';
import { InputState } from '../../src/game/input/InputState';
import { createWeaponState, fireWeapons } from '../../src/game/systems/fireWeapons';
import { updateProjectiles } from '../../src/game/systems/updateProjectiles';
import { sweepPointAgainstRectangle, sweepPointOutOfRectangle } from '../../src/game/systems/collision';
import { resolveProjectile } from '../../src/game/entities/Projectile';
import type { ProjectileState } from '../../src/game/entities/Projectile';

function start(config: GameConfig = DEFAULT_GAME_CONFIG) {
  const game = new GameController({ readConfig: () => config });
  game.markReady(); game.start(); game.advance(0); return game;
}

function steps(game: GameController, count: number) {
  for (let step = 0; step < count; step += 1) game.advance(1000 / 60);
}

function projectile(values: Partial<ProjectileState> = {}): ProjectileState {
  return { id: 1, weapon: 'front', x: 800, y: 360, directionX: 0, directionY: -1,
    speed: 400, damage: 25, remainingLifetimeSeconds: 2, resolution: null, ...values };
}

test('front fires one and each broadside fires three parallel shots at ship-relative origins for every heading', () => {
  const bases: Record<WeaponId, { origins: number[][]; direction: number[] }> = {
    front: { origins: [[0, -60]], direction: [0, -1] },
    leftBroadside: { origins: [[-38, 24], [-38, 0], [-38, -24]], direction: [-1, 0] },
    rightBroadside: { origins: [[38, 24], [38, 0], [38, -24]], direction: [1, 0] },
  };
  for (const rotation of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, 0.73]) {
    const input = new InputState();
    input.set('fireFront', true); input.set('fireLeft', true); input.set('fireRight', true);
    const state = createWeaponState();
    const player = { x: 640, y: 360, rotation, health: 100 };
    const shots = fireWeapons(player, input, DEFAULT_GAME_CONFIG, state, 0);
    expect(shots.map((shot) => shot.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const weapon of ['front', 'leftBroadside', 'rightBroadside'] as const) {
      const group = shots.filter((shot) => shot.weapon === weapon);
      const base = bases[weapon]; expect(group).toHaveLength(base.origins.length);
      group.forEach((shot, index) => {
        const [x, y] = base.origins[index];
        expect(shot.x).toBeCloseTo(640 + x * Math.cos(rotation) - y * Math.sin(rotation), 10);
        expect(shot.y).toBeCloseTo(360 + x * Math.sin(rotation) + y * Math.cos(rotation), 10);
        expect(shot.directionX).toBeCloseTo(base.direction[0] * Math.cos(rotation) - base.direction[1] * Math.sin(rotation), 10);
        expect(shot.directionY).toBeCloseTo(base.direction[0] * Math.sin(rotation) + base.direction[1] * Math.cos(rotation), 10);
        expect(Math.hypot(shot.directionX, shot.directionY)).toBeCloseTo(1, 10);
        expect(shot.speed).toBe(400); expect(shot.damage).toBe(25);
        expect(shot.remainingLifetimeSeconds).toBe(2); expect(shot.resolution).toBeNull();
        expect(shot.directionX).toBe(group[0].directionX); expect(shot.directionY).toBe(group[0].directionY);
      });
      expect(state.readyAtSeconds[weapon]).toBe(DEFAULT_GAME_CONFIG.weapons[weapon].cooldownSeconds);
    }
    player.rotation = 2; expect(shots[0].directionX).toBeCloseTo(Math.sin(rotation), 10);
  }
});

test('independent configured cooldowns fire at exact fixed-time boundaries, not once per broadside shot', () => {
  const config = { ...DEFAULT_GAME_CONFIG, weapons: { front: { cooldownSeconds: 0.05 },
    leftBroadside: { cooldownSeconds: 0.1 }, rightBroadside: { cooldownSeconds: 0.15 } } };
  const game = start(config);
  game.input.set('fireFront', true); game.input.set('fireLeft', true); game.input.set('fireRight', true);
  steps(game, 1); expect(game.getProjectileStates()).toHaveLength(7);
  steps(game, 2); expect(game.getProjectileStates()).toHaveLength(7);
  steps(game, 1); expect(game.getProjectileStates()).toHaveLength(8);
  steps(game, 2); expect(game.getProjectileStates()).toHaveLength(8);
  steps(game, 1); expect(game.getProjectileStates()).toHaveLength(12);
  steps(game, 2); expect(game.getProjectileStates()).toHaveLength(12);
  steps(game, 1); expect(game.getProjectileStates()).toHaveLength(16);
  expect(game.getProjectileStates().filter((shot) => shot.weapon === 'front')).toHaveLength(4);
  expect(game.getProjectileStates().filter((shot) => shot.weapon === 'leftBroadside')).toHaveLength(6);
  expect(game.getProjectileStates().filter((shot) => shot.weapon === 'rightBroadside')).toHaveLength(6);
  game.input.clear(); steps(game, 5); expect(game.getProjectileStates()).toHaveLength(16);
});

test('movement and rotation precede firing, and a newborn projectile advances only on its next step', () => {
  const game = start();
  game.input.set('moveForward', true); game.input.set('turnRight', true); game.input.set('fireFront', true);
  steps(game, 1);
  const player = game.getPlayerState(); const shot = game.getProjectileStates()[0];
  if (!player) throw new Error('Missing player.');
  expect(shot.x).toBeCloseTo(player.x + Math.sin(player.rotation) * 60, 10);
  expect(shot.y).toBeCloseTo(player.y - Math.cos(player.rotation) * 60, 10);
  expect(shot.remainingLifetimeSeconds).toBe(2);
  game.input.clear(); steps(game, 1);
  expect(game.getProjectileStates()[0].x).toBeCloseTo(shot.x + shot.directionX * 400 / 60, 10);
  expect(game.getProjectileStates()[0].y).toBeCloseTo(shot.y + shot.directionY * 400 / 60, 10);
});

test('projectile motion, cooldowns and simultaneous player actions are identical at 10–144 Hz', () => {
  const results = [];
  for (const updateMs of [100, 40, 1000 / 30, 1000 / 60, 1000 / 144]) {
    const game = start();
    for (const action of ['moveForward', 'turnRight', 'fireFront', 'fireLeft', 'fireRight'] as const) game.input.set(action, true);
    for (let elapsed = 0; elapsed < 3000;) {
      const delta = Math.min(updateMs, 3000 - elapsed); game.advance(delta); elapsed += delta;
    }
    results.push({ player: game.getPlayerState(), projectiles: game.getProjectileStates() });
  }
  expect(results[0].projectiles.length).toBeGreaterThan(0);
  for (const result of results) expect(result).toEqual(results[0]);
});

test('lifetime gives a speed×lifetime range, expires exactly, and resolved references cannot update again', () => {
  const shot = projectile({ speed: 30, remainingLifetimeSeconds: 0.1 });
  let active = [shot];
  for (let step = 0; step < 5; step += 1) active = updateProjectiles(active, 1 / 60, ARENA_LAYOUT);
  expect(active).toHaveLength(1);
  active = updateProjectiles(active, 1 / 60, ARENA_LAYOUT);
  expect(active).toHaveLength(0); expect(shot.y).toBeCloseTo(357, 10); expect(shot.resolution).toBe('expired');
  const terminal = { ...shot };
  expect(resolveProjectile(shot, 'island')).toBe(false);
  expect(updateProjectiles([shot], 100, ARENA_LAYOUT)).toEqual([]);
  expect(shot).toEqual(terminal);
});

test('swept island collision stops at the first contact from all sides without tunneling or repeated resolution', () => {
  for (const values of [
    { x: 600, y: 320, directionX: -1, directionY: 0, contactX: 453, contactY: 320 },
    { x: 100, y: 320, directionX: 1, directionY: 0, contactX: 251, contactY: 320 },
    { x: 350, y: 100, directionX: 0, directionY: 1, contactX: 350, contactY: 219 },
    { x: 350, y: 550, directionX: 0, directionY: -1, contactX: 350, contactY: 421 },
  ]) {
    const shot = projectile({ ...values, speed: 60000 });
    expect(updateProjectiles([shot], 1 / 60, ARENA_LAYOUT)).toEqual([]);
    expect(shot.resolution).toBe('island');
    expect(shot.x).toBeCloseTo(values.contactX, 10); expect(shot.y).toBeCloseTo(values.contactY, 10);
    const terminal = { ...shot };
    expect(resolveProjectile(shot, 'island')).toBe(false);
    expect(updateProjectiles([shot], 1 / 60, ARENA_LAYOUT)).toEqual([]);
    expect(shot).toEqual(terminal);
  }
});

test('all arena exits clean up at the footprint boundary; invalid initial positions resolve immediately', () => {
  for (const values of [
    { x: 800, y: 100, directionX: -1, directionY: 0, contactX: 5, contactY: 100 },
    { x: 800, y: 100, directionX: 1, directionY: 0, contactX: 1275, contactY: 100 },
    { x: 800, y: 360, directionX: 0, directionY: -1, contactX: 800, contactY: 5 },
    { x: 800, y: 360, directionX: 0, directionY: 1, contactX: 800, contactY: 715 },
  ]) {
    const shot = projectile({ ...values, speed: 60000 });
    expect(updateProjectiles([shot], 1 / 60, ARENA_LAYOUT)).toEqual([]);
    expect(shot.resolution).toBe('arena-exit');
    expect(shot.x).toBeCloseTo(values.contactX, 10); expect(shot.y).toBeCloseTo(values.contactY, 10);
  }
  const outside = projectile({ x: -10 });
  expect(updateProjectiles([outside], 1 / 60, ARENA_LAYOUT)).toEqual([]);
  expect(outside.x).toBe(-10); expect(outside.resolution).toBe('arena-exit');
  const inside = projectile({ x: 350, y: 320 });
  expect(updateProjectiles([inside], 1 / 60, ARENA_LAYOUT)).toEqual([]);
  expect(inside.y).toBe(320); expect(inside.resolution).toBe('island');
});

test('the earliest terminal event wins: expiry before contact or contact before expiry', () => {
  const short = projectile({ x: 600, y: 320, directionX: -1, directionY: 0, remainingLifetimeSeconds: 0.1 });
  expect(updateProjectiles([short], 0.5, ARENA_LAYOUT)).toEqual([]);
  expect(short.resolution).toBe('expired'); expect(short.x).toBe(560);
  const long = projectile({ x: 600, y: 320, directionX: -1, directionY: 0, remainingLifetimeSeconds: 0.5 });
  expect(updateProjectiles([long], 0.5, ARENA_LAYOUT)).toEqual([]);
  expect(long.resolution).toBe('island'); expect(long.x).toBe(453);
});

test('projectile contact queries preserve the existing player sweep semantics', () => {
  const rect = { x: 10, y: 10, width: 20, height: 20 };
  expect(sweepPointAgainstRectangle({ x: 0, y: 20 }, { x: 10, y: 20 }, rect)).toBeNull();
  expect(sweepPointAgainstRectangle({ x: 0, y: 20 }, { x: 10, y: 20 }, rect, true)).toBe(1);
  expect(sweepPointOutOfRectangle({ x: 20, y: 20 }, { x: 30, y: 20 }, rect)).toBeNull();
  expect(sweepPointOutOfRectangle({ x: 30, y: 20 }, { x: 40, y: 20 }, rect)).toBe(0);
});

test('pause freezes projectiles/cooldowns, resume has no time jump, and end/restart/destroy clear state', () => {
  const game = start(); game.input.set('fireFront', true); steps(game, 1);
  const before = game.getProjectileStates(); game.pause(); game.advance(60000);
  expect(game.getProjectileStates()).toEqual(before);
  game.resume(); game.advance(60000); expect(game.getProjectileStates()).toEqual(before);
  steps(game, 1); expect(game.getProjectileStates()).toHaveLength(1);
  expect(game.getProjectileStates()[0].y).toBeCloseTo(before[0].y - 400 / 60, 10);
  game.input.set('fireFront', true); steps(game, 1); expect(game.getProjectileStates()).toHaveLength(1);
  game.end(); expect(game.getProjectileStates()).toEqual([]); game.advance(1000);
  game.restart(); game.advance(0); game.input.set('fireFront', true); steps(game, 1);
  expect(game.getProjectileStates()[0].id).toBe(1);
  game.restart(); expect(game.getProjectileStates()).toEqual([]);
  game.advance(0); game.input.set('fireRight', true); steps(game, 1); expect(game.getProjectileStates()).toHaveLength(3);
  game.destroy(); game.destroy(); expect(game.getProjectileStates()).toEqual([]);
  game.advance(1000); expect(game.getProjectileStates()).toEqual([]);
});

test('active config and projectile reads are immutable, and firing publishes no per-step UI events', () => {
  const config = { ...DEFAULT_GAME_CONFIG, projectiles: { ...DEFAULT_GAME_CONFIG.projectiles },
    weapons: { ...DEFAULT_GAME_CONFIG.weapons, front: { ...DEFAULT_GAME_CONFIG.weapons.front } } };
  const game = start(config); let events = 0; game.subscribe(() => { events += 1; });
  config.projectiles.speed = 999; config.projectiles.damage = 99; config.projectiles.lifetimeSeconds = 99;
  config.weapons.front.cooldownSeconds = 0.001;
  game.input.set('fireFront', true); steps(game, 30);
  expect(game.getProjectileStates()).toHaveLength(1);
  steps(game, 1); const shots = game.getProjectileStates(); expect(shots).toHaveLength(2);
  for (const shot of shots) { expect(shot.speed).toBe(400); expect(shot.damage).toBe(25); }
  expect(shots[1].remainingLifetimeSeconds).toBe(2);
  expect(Object.isFrozen(shots)).toBe(true); expect(Object.isFrozen(shots[0])).toBe(true);
  expect(Reflect.set(shots[0], 'x', 0)).toBe(false); expect(events).toBe(1);
});
