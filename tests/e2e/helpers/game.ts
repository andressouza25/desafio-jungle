import { expect, type Page } from '@playwright/test';
import type { Application } from 'pixi.js';
import type { GameController } from '../../../src/game/core/GameController';

declare global {
  interface Window {
    __coverageGame: { app: Application | null; controller: GameController | null };
  }
}

export async function observeGame(page: Page, seed = 1, capturePixi = true) {
  // Test-runner injection only. Observe existing owners; expose no production debug API.
  await page.addInitScript((controls: { seed: number; capturePixi: boolean }) => {
    Reflect.set(window, '__pirateBattleTestSeed', controls.seed);
    const observation: Window['__coverageGame'] = { app: null, controller: null };
    window.__coverageGame = observation;
    if (controls.capturePixi) Reflect.set(window, '__PIXI_APP_INIT__', (app: Application) => { observation.app = app; });
    function inspect(value: unknown, depth = 0): void {
      if (!value || typeof value !== 'object' || depth > 50) return;
      let hook: unknown = Reflect.get(value, 'memoizedState');
      for (let i = 0; i < 20 && hook && typeof hook === 'object'; i++) {
        const state: unknown = Reflect.get(hook, 'memoizedState');
        if (state && typeof state === 'object') {
          const current: unknown = Reflect.get(state, 'current');
          if (current && typeof current === 'object') {
            const controller: unknown = Reflect.get(current, 'controller');
            if (controller && typeof controller === 'object' && typeof Reflect.get(controller, 'getSnapshot') === 'function'
              && typeof Reflect.get(controller, 'getEnemyStates') === 'function') observation.controller = controller as GameController;
          }
        }
        hook = Reflect.get(hook, 'next');
      }
      inspect(Reflect.get(value, 'child'), depth + 1); inspect(Reflect.get(value, 'sibling'), depth + 1);
    }
    Reflect.set(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      supportsFiber: true, renderers: new Map(), inject() { return 1; },
      onCommitFiberRoot(_id: number, root: unknown) { if (root && typeof root === 'object') inspect(Reflect.get(root, 'current')); },
      onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    });
  }, { seed, capturePixi });
}

export async function prepareGame(page: Page, seed = 1) {
  await observeGame(page, seed);
  await page.clock.install({ time: '2026-09-30T00:00:00Z' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
  await page.clock.pauseAt('2026-09-30T00:01:00Z');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('pirate-battle:')))).toEqual([]);
  await page.evaluate(() => window.pirateBattleNetwork.reset());
}

export async function setOptions(page: Page, durationSeconds: number, intervalSeconds: number) {
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('textbox', { name: 'Game session time' }).fill(String(durationSeconds));
  await page.getByRole('textbox', { name: 'Enemy spawn time' }).fill(String(intervalSeconds));
  const save = page.getByRole('button', { name: 'Save Changes' });
  if (await save.isEnabled()) await save.click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
}

export async function startBattle(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
}

export async function readBattle(page: Page) {
  return page.evaluate(() => {
    const { controller, app } = window.__coverageGame;
    if (!controller) throw new Error('Missing active simulation observation');
    const world = app?.stage?.children[0];
    return { player: controller.getPlayerState(), enemies: controller.getEnemyStates(), shots: controller.getProjectileStates(),
      snapshot: controller.getSnapshot(),
      rendered: (world?.children ?? []).filter(child => child.label.startsWith('enemy:')).map(child => ({ label: child.label, x: child.x, y: child.y })),
    };
  });
}

export async function completeBattle(page: Page) {
  // Control simulation time only; all real spawning, combat and terminal rules still run.
  await page.evaluate(() => {
    const controller = window.__coverageGame.controller;
    if (!controller) throw new Error('Missing simulation clock');
    for (let i = 0; i < 1800 && controller.getSnapshot().state === 'running'; i++) controller.advance(100);
  });
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
}
