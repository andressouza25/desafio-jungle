import { expect, test } from '@playwright/test';
import type { Application } from 'pixi.js';
import type { GameController } from '../../src/game/core/GameController';

test('timeout result persists, Play Again starts cleanly and Main Menu exits without another result', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
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
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('textbox', { name: 'Game session time' }).fill('60');
  await page.getByRole('textbox', { name: 'Enemy spawn time' }).fill('30');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByRole('definition').first()).toHaveText('100 / 100');
  await page.evaluate(() => { for (let i = 0; i < 300; i++) window.__enemyProbe.controller?.advance(100); });
  await page.clock.runFor(17);
  await page.screenshot({ path: testInfo.outputPath('hud-combat.png'), fullPage: true });
  await page.evaluate(() => { for (let i = 0; i < 310; i++) window.__enemyProbe.controller?.advance(100); });
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
  await expect(page.getByText('Time up', { exact: true })).toBeVisible();
  await expect(page.getByText('01:00', { exact: true })).toBeVisible();
  await expect(page.getByText('Result saved on this device.')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('result.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Play Again' })).toBeFocused();
  expect(await page.getByRole('button', { name: 'Play Again' }).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Match running.');
  await expect(page.getByRole('definition').first()).toHaveText('100 / 100');
  await expect(page.getByRole('definition').nth(1)).toHaveText('0');
  await expect(page.getByRole('definition').nth(2)).toHaveText('01:00');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Time up', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('real enemy combat ends by player death and shows its effective duration', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
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
  await page.evaluate(() => { for (let i = 0; i < 600; i++) window.__enemyProbe.controller?.advance(100); });
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
  await expect(page.getByText('Ship destroyed', { exact: true })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pirate-battle:last-result:v1') ?? 'null'));
  expect(stored.reason).toBe('player-death'); expect(stored.durationSeconds).toBeGreaterThan(0); expect(stored.durationSeconds).toBeLessThan(60);
  const resultText = await page.locator('main').innerText();
  await page.evaluate(() => { for (let i = 0; i < 600; i++) window.__enemyProbe.controller?.advance(100); }); expect(await page.locator('main').innerText()).toBe(resultText);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();
  expect(errors).toEqual([]);
});
