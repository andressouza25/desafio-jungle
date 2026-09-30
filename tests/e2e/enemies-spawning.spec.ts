import { expect, test } from '@playwright/test';
import type { Application, Container } from 'pixi.js';
import type { GameController } from '../../src/game/core/GameController';

declare global {
  interface Window {
    __enemyProbe: { app: Application | null; commits: number; controller: GameController | null; observed: Container[] };
  }
}
test('real combat, seeded enemies, pause and cleanup do not cause per-step React commits', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const probe: Window['__enemyProbe'] = { app: null, commits: 0, controller: null, observed: [] };
    window.__enemyProbe = probe;
    Reflect.set(window, '__PIXI_APP_INIT__', (app: Application) => { probe.app = app; });
    // Read the existing session through the standard React devtools hook; never mutate it.
    function inspect(value: unknown, depth = 0): void {
      if (!value || typeof value !== 'object' || depth > 50) return;
      const memoized = Reflect.get(value, 'memoizedState');
      let hook: unknown = memoized;
      for (let i = 0; i < 20 && hook && typeof hook === 'object'; i++) {
        const state: unknown = Reflect.get(hook, 'memoizedState');
        if (state && typeof state === 'object') {
          const current: unknown = Reflect.get(state, 'current');
          if (current && typeof current === 'object') {
            const controller: unknown = Reflect.get(current, 'controller');
            if (controller && typeof controller === 'object' && typeof Reflect.get(controller, 'getEnemyStates') === 'function') {
              // Runtime guard validates the session's simulation owner; read-only test observation.
              probe.controller = controller as GameController;
            }
          }
        }
        hook = Reflect.get(hook, 'next');
      }
      inspect(Reflect.get(value, 'child'), depth + 1); inspect(Reflect.get(value, 'sibling'), depth + 1);
    }
    Reflect.set(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      supportsFiber: true, renderers: new Map(), inject() { return 1; },
      onCommitFiberRoot(_id: number, root: unknown) { probe.commits++; if (root && typeof root === 'object') inspect(Reflect.get(root, 'current')); },
      onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    });
  });
  await page.clock.install({ time: '2026-01-01T00:00:00Z' });
  await page.goto('/'); await page.clock.pauseAt('2026-01-01T00:01:00Z');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  const read = () => page.evaluate(() => {
    const probe = window.__enemyProbe; const controller = probe.controller;
    if (!controller) throw new Error('Missing simulation observation');
    for (const child of probe.app?.stage.children[0]?.children ?? []) {
      if ((child.label.startsWith('enemy:') || child.label.startsWith('projectile:')) && !probe.observed.includes(child)) probe.observed.push(child);
    }
    return { seconds: controller.getSnapshot().elapsedSeconds, enemies: controller.getEnemyStates(), shots: controller.getProjectileStates(), player: controller.getPlayerState(), commits: probe.commits };
  });
  const commits = (await read()).commits;
  const positionForCombat = async () => {
    await page.keyboard.down('d'); await page.clock.runFor(Math.PI / 2.5 * 1000); await page.keyboard.up('d');
    await page.keyboard.down('w'); await page.clock.runFor(1300); await page.keyboard.up('w');
    await page.clock.runFor(3500);
  };
  await positionForCombat();
  const first = await read(); expect(first.enemies).toHaveLength(2); expect(first.enemies[1].kind).toBe('shooter');
  // Aim using actual player rotation and real keyboard actions.
  const target = first.enemies[1]; const player = first.player;
  if (!player) throw new Error('Missing player');
  const desired = Math.atan2(target.x - player.x, -(target.y - player.y));
  const difference = ((desired - player.rotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const key = difference > 0 ? 'd' : 'a';
  await page.keyboard.down(key); await page.clock.runFor(Math.abs(difference) / 2.5 * 1000); await page.keyboard.up(key);
  await page.keyboard.down('Space');
  let damaged = false; let destroyed = false; let enemyShot = false; let playerDamaged = false; const kinds = new Set<string>();
  for (let i = 0; i < 80; i++) {
    const current = await read(); const tracked = current.enemies.find(enemy => enemy.id === target.id);
    if (tracked && current.player) {
      const heading = Math.atan2(tracked.x - current.player.x, -(tracked.y - current.player.y));
      const turn = ((heading - current.player.rotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      if (Math.abs(turn) > 0.03) {
        const turnKey = turn > 0 ? 'd' : 'a';
        await page.keyboard.down(turnKey); await page.clock.runFor(Math.abs(turn) / 2.5 * 1000); await page.keyboard.up(turnKey);
      }
    }
    await page.clock.runFor(200); const state = await read();
    for (const enemy of state.enemies) kinds.add(enemy.kind);
    const original = state.enemies.find(enemy => enemy.id === target.id);
    damaged ||= Boolean(original && original.health < 75); destroyed ||= !original;
    if (!original) await page.keyboard.up('Space');
    enemyShot ||= state.shots.some(shot => shot.weapon === 'enemy');
    playerDamaged ||= Boolean(state.player && state.player.health < 100);
    if (damaged && destroyed && enemyShot && playerDamaged && kinds.size === 2) break;
  }
  await page.keyboard.up('Space');
  expect({ damaged, destroyed, enemyShot, playerDamaged }, JSON.stringify({ first, final: await read() })).toEqual({ damaged: true, destroyed: true, enemyShot: true, playerDamaged: true });
  expect(kinds).toEqual(new Set(['chaser', 'shooter'])); expect((await read()).commits).toBe(commits);
  await page.screenshot({ path: testInfo.outputPath('enemy-combat.png'), fullPage: true });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await read(); await page.clock.fastForward(60000); expect(await read()).toEqual(paused);
  await page.getByRole('button', { name: 'Resume', exact: true }).click(); await page.clock.runFor(100);
  expect((await read()).seconds).toBeGreaterThan(paused.seconds);
  await page.getByRole('button', { name: 'End Match' }).click();
  expect((await read()).enemies).toEqual([]); expect((await read()).shots).toEqual([]);
  expect(await page.evaluate(() => window.__enemyProbe.observed.every(sprite => sprite.destroyed))).toBe(true);
  await page.getByRole('button', { name: 'Restart Match' }).click(); await positionForCombat();
  expect((await read()).enemies).toEqual(first.enemies);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__enemyProbe.observed.every(sprite => sprite.destroyed))).toBe(true);
  expect(errors).toEqual([]);
});
