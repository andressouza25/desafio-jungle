import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Application } from 'pixi.js';

declare global { interface Window { __touchApp: Application; } }
const browserErrors = new WeakMap<Page, string[]>();
async function pointer(page: Page, action: string, id: number, type = 'pointerdown') {
  await page.locator(`[data-game-action="${action}"]`).dispatchEvent(type, { pointerId: id, pointerType: 'touch', button: 0, bubbles: true });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const world = window.__touchApp.stage.children[0];
    const ship = world.children.find((child) => child.label === 'player');
    if (!ship) throw new Error('Player missing');
    return { x: ship.x, y: ship.y, rotation: ship.rotation,
      weapons: world.children.filter((child) => child.label.startsWith('projectile:')).map((child) => child.label.split(':')[2]) };
  });
}
async function enter(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
}
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-chromium', 'Touch layout uses the existing mobile project.');
  const errors: string[] = []; browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 740, height: 360 });
  await page.addInitScript(() => Reflect.set(window, '__PIXI_APP_INIT__', (app: Application) => { window.__touchApp = app; }));
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('textbox', { name: 'Enemy spawn time' }).fill('30');
  await page.getByRole('textbox', { name: 'Game session time' }).fill('60');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await enter(page);
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page) ?? []).toEqual([]); });

test('shared touch actions, independent release/cancel and lifecycle clearing', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  const initial = await state(page);
  await pointer(page, 'moveForward', 1); await pointer(page, 'turnRight', 2); await pointer(page, 'fireFront', 3);
  await page.clock.runFor(160);
  const moving = await state(page);
  expect(moving.y).toBeLessThan(initial.y); expect(moving.rotation).toBeGreaterThan(initial.rotation);
  expect(moving.weapons).toContain('front');
  await pointer(page, 'moveForward', 4);
  await pointer(page, 'moveForward', 1, 'pointerup');
  await pointer(page, 'turnRight', 2, 'pointercancel');
  await pointer(page, 'fireFront', 3, 'pointerup');
  await page.clock.runFor(160);
  const released = await state(page); expect(released.y).toBeLessThan(moving.y); expect(released.rotation).toBe(moving.rotation);
  await pointer(page, 'moveForward', 4, 'pointercancel');
  await pointer(page, 'moveForward', 11); await pointer(page, 'moveForward', 11, 'lostpointercapture');
  await page.clock.runFor(32); expect((await state(page)).y).toBe(released.y);
  await pointer(page, 'turnLeft', 5); await pointer(page, 'fireLeft', 6); await pointer(page, 'fireRight', 7);
  await page.clock.runFor(80);
  expect((await state(page)).rotation).toBeLessThan(released.rotation);
  expect((await state(page)).weapons).toEqual(expect.arrayContaining(['leftBroadside', 'rightBroadside']));
  await pointer(page, 'pause', 8); await page.clock.runFor(32);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('[data-pressed]')).toHaveCount(0);
  const paused = await state(page);
  await page.getByRole('button', { name: 'Resume', exact: true }).click(); await page.clock.runFor(160);
  expect((await state(page)).x).toBe(paused.x); expect((await state(page)).rotation).toBe(paused.rotation);
  await pointer(page, 'moveForward', 9); await page.getByRole('button', { name: 'End Match', exact: true }).click();
  await expect(page.locator('[data-pressed]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restart Match' }).click();
  await pointer(page, 'moveForward', 10); await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await enter(page); await page.clock.runFor(160);
  expect((await state(page)).y).toBe(360); await expect(page.locator('[data-pressed]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('real simultaneous Chromium touch, viewport fitting, targets and orientation transitions', async ({ page }, info) => {
  const client = await page.context().newCDPSession(page);
  expect(await page.locator('canvas').evaluate((element) => getComputedStyle(element).touchAction)).toBe('auto');
  expect(await page.locator('[data-game-action="moveForward"]').evaluate((element) => getComputedStyle(element).touchAction)).toBe('none');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2.75, mobile: true });
  await page.clock.runFor(64);
  const buttons = ['moveForward', 'turnRight', 'fireFront'];
  const points = [];
  for (const [id, action] of buttons.entries()) {
    const box = await page.locator(`[data-game-action="${action}"]`).boundingBox();
    if (!box) throw new Error('Missing control');
    points.push({ id, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
  await page.clock.runFor(160);
  expect((await state(page)).y).toBeLessThan(360); expect((await state(page)).weapons).toContain('front');
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('[data-pressed]')).toHaveCount(0);
  for (const action of ['turnLeft', 'fireLeft', 'fireRight']) {
    const box = await page.locator(`[data-game-action="${action}"]`).boundingBox();
    if (!box) throw new Error('Missing control');
    const before = await state(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 10, x: box.x + 24, y: box.y + 24 }] });
    await page.clock.runFor(100);
    const after = await state(page);
    if (action === 'turnLeft') expect(after.rotation).toBeLessThan(before.rotation);
    else expect(after.weapons).toContain(action === 'fireLeft' ? 'leftBroadside' : 'rightBroadside');
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.getByRole('button', { name: 'Pause', exact: true }).tap(); await page.clock.runFor(32);
  for (const size of [{ width: 568, height: 320 }, { width: 932, height: 430 }, { width: 390, height: 844 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(size);
    await expect.poll(async () => {
      await page.clock.runFor(32);
      return page.evaluate(() => {
        const host = document.querySelector('[data-testid="arena-viewport"]');
        if (!(host instanceof HTMLElement)) return false;
        const world = window.__touchApp.stage.children[0];
        return Math.abs(world.scale.x - Math.min(host.clientWidth / 1280, host.clientHeight / 720)) < 1e-6;
      });
    }).toBe(true);
    for (const button of await page.locator('[data-game-action]').all()) {
      const box = await button.boundingBox(); expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
      await expect(button).toHaveAttribute('aria-label', /\w/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const arena = await page.getByTestId('arena-viewport').boundingBox();
    const controls = await page.getByRole('group', { name: 'Touch gameplay controls' }).boundingBox();
    expect(controls?.y).toBeGreaterThanOrEqual((arena?.y ?? 0) + (arena?.height ?? 0));
    const dialog = page.getByRole('dialog');
    expect(await dialog.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
    await page.screenshot({ path: info.outputPath(`pause-${size.width}.png`) });
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.screenshot({ path: info.outputPath(`mobile-${size.width}.png`) });
    await page.getByRole('button', { name: 'Pause', exact: true }).tap(); await page.clock.runFor(32);
  }
  await client.send('Emulation.setDeviceMetricsOverride', { width: 738, height: 360, deviceScaleFactor: 2, mobile: true });
  await page.clock.runFor(64);
  await expect.poll(async () => { await page.clock.runFor(32); return page.evaluate(() => window.__touchApp.renderer.resolution); }).toBe(2);
  await client.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 12, right: 24, bottom: 16, left: 24 } });
  await page.clock.runFor(64);
  expect(await page.locator('.game-screen').evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
  })).toEqual(['12px', '24px', '16px', '24px']);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  const before = await state(page);
  const resizedButton = await page.locator('[data-game-action="moveForward"]').boundingBox();
  if (!resizedButton) throw new Error('Missing resized control');
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 99, x: resizedButton.x + 24, y: resizedButton.y + 24 }] });
  await page.clock.runFor(100);
  expect((await state(page)).y).toBeLessThan(before.y);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await enter(page); await page.clock.runFor(100);
  expect((await state(page)).y).toBe(360);
  await client.detach();
});

test('blur and hidden interruptions clear touches, and automatic match end releases active controls', async ({ page }) => {
  test.setTimeout(90000);
  for (const interruption of ['blur', 'hidden']) {
    await pointer(page, 'moveForward', 1); await pointer(page, 'fireFront', 2);
    await page.evaluate((kind) => {
      if (kind === 'blur') window.dispatchEvent(new Event('blur'));
      else {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, interruption);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-pressed]')).toHaveCount(0);
    const paused = await state(page);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await page.getByRole('button', { name: 'Resume', exact: true }).click(); await page.clock.runFor(100);
    expect((await state(page)).y).toBe(paused.y);
  }
  await pointer(page, 'turnRight', 3); await pointer(page, 'fireFront', 4);
  await page.clock.runFor(61000);
  await expect(page.getByRole('heading', { name: /Battle Complete|Ship Sunk/ })).toBeVisible();
  await page.getByRole('button', { name: 'Play Again', exact: true }).click(); await page.clock.runFor(100);
  await expect(page.locator('[data-pressed]')).toHaveCount(0);
  expect((await state(page)).rotation).toBe(Math.PI);
});
