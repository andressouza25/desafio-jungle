import { expect, test } from '@playwright/test';
import type { Application } from 'pixi.js';

declare global {
  interface Window {
    __lifecycleProbe: { application: Application | null; ticks: number; commits: number; errors: string[] };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe: Window['__lifecycleProbe'] = { application: null, ticks: 0, commits: 0, errors: [] };
    window.__lifecycleProbe = probe;
    window.addEventListener('error', (event) => probe.errors.push(event.message));
    window.addEventListener('unhandledrejection', (event) => probe.errors.push(String(event.reason)));
    // Standard devtools hooks observe real Pixi ticks and real React commits, not a mock loop.
    Reflect.set(window, '__PIXI_APP_INIT__', (application: Application) => {
      probe.application = application;
      application.ticker.add(() => { probe.ticks += 1; });
    });
    Reflect.set(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      supportsFiber: true,
      renderers: new Map<number, unknown>(),
      inject(renderer: unknown) { this.renderers.set(1, renderer); return 1; },
      onCommitFiberRoot: () => { probe.commits += 1; },
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {},
    });
  });
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__lifecycleProbe.errors)).toEqual([]);
});

test('drives lifecycle with one owned ticker and no per-step React commits', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: '2026-01-01T00:00:00Z' });
  await page.goto('/');
  await page.clock.pauseAt('2026-01-01T00:01:00Z');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Arena ready. No match is running.');
  await expect(page.getByRole('img', { name: 'Water arena' })).toHaveCount(1);
  expect(await page.evaluate(() => window.__lifecycleProbe.application?.ticker.started)).toBe(false);

  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  const commits = await page.evaluate(() => window.__lifecycleProbe.commits);
  expect(commits).toBeGreaterThan(0); // Ensure the observation hook actually works.
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBeGreaterThanOrEqual(50);
  expect(await page.evaluate(() => window.__lifecycleProbe.commits)).toBe(commits);
  // Two owned callbacks (elapsed delivery + render), plus this test's tick observer.
  expect(await page.evaluate(() => window.__lifecycleProbe.application?.ticker.count)).toBe(3);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  const pausedTicks = await page.evaluate(() => window.__lifecycleProbe.ticks);
  await page.clock.fastForward(60_000);
  expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBe(pausedTicks);
  expect(await page.evaluate(() => window.__lifecycleProbe.application?.ticker.started)).toBe(false);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBeGreaterThan(pausedTicks);

  await page.getByRole('button', { name: 'End Match' }).click();
  await expect(page.getByRole('status')).toHaveText('Match ended.');
  const endedTicks = await page.evaluate(() => window.__lifecycleProbe.ticks);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBe(endedTicks);
  for (let restart = 0; restart < 5; restart += 1) {
    await page.getByRole('button', { name: 'Restart Match' }).click();
    await expect(page.getByRole('status')).toHaveText('Match running.');
    await page.clock.runFor(100);
    expect(await page.evaluate(() => window.__lifecycleProbe.application?.ticker.count)).toBe(3);
    await expect(page.locator('canvas')).toHaveCount(1);
  }
  await page.screenshot({ path: testInfo.outputPath('running-foundation.png'), fullPage: true });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.__lifecycleProbe.application?.renderer))).toBe(false);
  const destroyedTicks = await page.evaluate(() => window.__lifecycleProbe.ticks);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBe(destroyedTicks);
  expect(errors).toEqual([]);
});

test('visibility and blur pause, returning focus does not resume, and hidden resume is rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Match' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');

  // Deterministically emulate browser visibility notifications without replacing the controller.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  expect(await page.evaluate(() => window.__lifecycleProbe.application?.ticker.started)).toBe(false);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('status')).toHaveText('Match paused.');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.evaluate(() => { window.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
});
