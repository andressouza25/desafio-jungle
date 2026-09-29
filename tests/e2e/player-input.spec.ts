import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Application } from 'pixi.js';

declare global {
  interface Window {
    __playerProbe: {
      application: Application | null;
      commits: number;
      listeners: Map<EventTarget, Set<EventListenerOrEventListenerObject>>;
      errors: string[];
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe: Window['__playerProbe'] = { application: null, commits: 0, listeners: new Map(), errors: [] };
    window.__playerProbe = probe;
    window.addEventListener('error', (event) => probe.errors.push(event.message));
    window.addEventListener('unhandledrejection', (event) => probe.errors.push(String(event.reason)));
    Reflect.set(window, '__PIXI_APP_INIT__', (app: Application) => { probe.application = app; });
    Reflect.set(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      supportsFiber: true, renderers: new Map<number, unknown>(),
      inject(renderer: unknown) { this.renderers.set(1, renderer); return 1; },
      onCommitFiberRoot: () => { probe.commits += 1; },
      onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {},
    });
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    function tracked(target: EventTarget, type: string) {
      return (target === window && (type === 'keydown' || type === 'keyup'))
        || (target instanceof HTMLElement && target.dataset.testid === 'arena-viewport' && type === 'focusout');
    }
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (listener && tracked(this, type)) {
        const listeners = probe.listeners.get(this) ?? new Set<EventListenerOrEventListenerObject>();
        listeners.add(listener); probe.listeners.set(this, listeners);
      }
      add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      if (listener && tracked(this, type)) probe.listeners.get(this)?.delete(listener);
      remove.call(this, type, listener, options);
    };
  });
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(message.text());
  });
  await page.clock.install({ time: '2026-01-01T00:00:00Z' });
  await page.goto('/');
  await page.clock.pauseAt('2026-01-01T00:01:00Z');
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__playerProbe.errors)).toEqual([]);
});

async function enter(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Match' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByTestId('arena-viewport')).toBeFocused();
}

async function player(page: Page) {
  return page.evaluate(() => {
    const world = window.__playerProbe.application?.stage.children[0];
    const ship = world?.children.find((child) => child.label === 'player');
    if (!world || !ship) throw new Error('Expected the rendered player.');
    return { x: ship.x, y: ship.y, rotation: ((ship.rotation - Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2),
      visible: ship.visible, entities: world.children.length };
  });
}

async function keyboardListeners(page: Page) {
  return page.evaluate(() => [...window.__playerProbe.listeners.values()].reduce((total, set) => total + set.size, 0));
}

test('real keyboard moves and turns the supplied ship without per-step React commits or firing', async ({ page }, testInfo) => {
  await enter(page);
  expect(await player(page)).toEqual({ x: 640, y: 360, rotation: 0, visible: true, entities: 2 });
  expect(await page.evaluate(() => {
    const ship = window.__playerProbe.application?.stage.children[0]?.children.find((child) => child.label === 'player');
    return { width: ship?.width, height: ship?.height };
  })).toEqual({ width: 66, height: 113 });
  const commits = await page.evaluate(() => window.__playerProbe.commits);
  expect(commits).toBeGreaterThan(0);
  await page.keyboard.down('w');
  await page.keyboard.down('Space'); await page.keyboard.down('q'); await page.keyboard.down('e');
  await page.clock.runFor(500);
  await page.keyboard.up('w'); await page.keyboard.up('Space'); await page.keyboard.up('q'); await page.keyboard.up('e');
  const moved = await player(page);
  expect(moved.y).toBeLessThan(280); expect(moved.y).toBeGreaterThanOrEqual(267);
  expect(moved.x).toBe(640); expect(moved.entities).toBe(2);
  await page.keyboard.down('a'); await page.clock.runFor(400); await page.keyboard.up('a');
  expect((await player(page)).rotation).toBeGreaterThan(5.2);
  expect(await page.evaluate(() => window.__playerProbe.commits)).toBe(commits);
  await page.getByRole('button', { name: 'Restart Match' }).click();
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(400); await page.keyboard.up('ArrowRight');
  const turned = await player(page);
  expect(turned.rotation).toBeGreaterThan(0.9); expect(turned.rotation).toBeLessThan(1.1);
  await page.keyboard.down('ArrowUp'); await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(300);
  await page.keyboard.up('ArrowUp'); await page.keyboard.up('ArrowLeft');
  const simultaneous = await player(page);
  expect(simultaneous.x).toBeGreaterThan(turned.x); expect(simultaneous.y).toBeLessThan(turned.y);
  expect(simultaneous.rotation).toBeLessThan(turned.rotation);
  const lifecycleCommits = await page.evaluate(() => window.__playerProbe.commits);
  await page.keyboard.down('w'); await page.clock.runFor(100); await page.keyboard.up('w');
  expect(await page.evaluate(() => window.__playerProbe.commits)).toBe(lifecycleCommits);
  await page.screenshot({ path: testInfo.outputPath('player-keyboard.png'), fullPage: true });
});

test('held keys cannot survive keyboard pause, blur, hidden tab, end or restart', async ({ page }) => {
  await enter(page);
  await page.keyboard.down('w'); await page.clock.runFor(100);
  await page.keyboard.press('Escape'); await page.clock.runFor(32);
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  const paused = await player(page);
  await page.clock.fastForward(60_000);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.keyboard.down('w'); // Actual repeated keydown while W is still held.
  await page.clock.runFor(100);
  expect(await player(page)).toEqual(paused);
  await page.keyboard.up('w'); await page.keyboard.down('w'); await page.clock.runFor(100);
  expect((await player(page)).y).toBeLessThan(paused.y);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  const blurred = await player(page);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(100); expect(await player(page)).toEqual(blurred);
  await page.keyboard.up('w'); await page.keyboard.down('w'); await page.clock.runFor(100);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  const hidden = await player(page);
  await page.clock.fastForward(60_000);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(100); expect(await player(page)).toEqual(hidden);
  await page.keyboard.up('w'); await page.keyboard.down('w'); await page.clock.runFor(100);
  await page.getByRole('button', { name: 'End Match' }).click();
  const ended = await player(page);
  await page.clock.runFor(1000); expect(await player(page)).toEqual(ended);
  await page.getByRole('button', { name: 'Restart Match' }).click();
  await page.clock.runFor(100);
  expect(await player(page)).toEqual({ x: 640, y: 360, rotation: 0, visible: true, entities: 2 });
  await page.keyboard.up('w');
});

test('keyboard context preserves page controls and listeners are removed through five remounts', async ({ page }) => {
  for (let cycle = 0; cycle < 5; cycle += 1) {
    expect(await keyboardListeners(page)).toBe(0);
    await enter(page);
    expect(await keyboardListeners(page)).toBe(3);
    expect(await page.getByTestId('arena-viewport').evaluate((host) => {
      return ['keydown', 'keyup'].map((type) => {
        const event = new KeyboardEvent(type, { code: 'KeyQ', ctrlKey: true, bubbles: true, cancelable: true });
        host.dispatchEvent(event); return event.defaultPrevented;
      });
    })).toEqual([false, false]);
    expect(await page.getByTestId('arena-viewport').evaluate((host) => getComputedStyle(host).outlineStyle)).not.toBe('none');
    await page.keyboard.down('w'); await page.clock.runFor(100);
    await page.getByRole('button', { name: 'Pause', exact: true }).focus();
    const before = await player(page);
    await page.clock.runFor(100); expect(await player(page)).toEqual(before); // Focus leaving arena clears input.
    await page.keyboard.press('Space'); // Native semantic button activation must still work.
    await expect(page.getByRole('status')).toHaveText('Match paused.');
    const cancelled = await page.getByTestId('arena-viewport').evaluate((host) => {
      const event = new KeyboardEvent('keydown', { code: 'ArrowUp', bubbles: true, cancelable: true });
      host.dispatchEvent(event); return event.defaultPrevented;
    });
    expect(cancelled).toBe(false);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(100); expect(await player(page)).toEqual(before);
    await page.keyboard.up('w');
    await page.keyboard.down('w'); await page.clock.runFor(100);
    const moved = await player(page);
    expect(before.y - moved.y).toBeGreaterThanOrEqual(15);
    expect(before.y - moved.y).toBeLessThanOrEqual(21); // No multiplied actions after remounts.
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await keyboardListeners(page)).toBe(0);
    await page.keyboard.up('w');
  }
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const duration = page.getByRole('textbox', { name: 'Game session time' });
  await duration.fill('150'); await page.keyboard.press('ArrowLeft');
  await expect(duration).toHaveValue('150');
  await expect(duration).toBeFocused();
});
