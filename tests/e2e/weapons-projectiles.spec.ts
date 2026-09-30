import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Application, Container } from 'pixi.js';

declare global {
  interface Window {
    __weaponProbe: { application: Application | null; observed: Container[]; errors: string[] };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe: Window['__weaponProbe'] = { application: null, observed: [], errors: [] };
    window.__weaponProbe = probe;
    Reflect.set(window, '__PIXI_APP_INIT__', (application: Application) => { probe.application = application; });
    window.addEventListener('error', (event) => probe.errors.push(event.message));
    window.addEventListener('unhandledrejection', (event) => probe.errors.push(String(event.reason)));
  });
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(message.text());
  });
  await page.clock.install({ time: '2026-01-01T00:00:00Z' });
  await page.goto('/');
  await page.clock.pauseAt('2026-01-01T00:01:00Z');
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__weaponProbe.errors)).toEqual([]);
});

async function enter(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Match' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByTestId('arena-viewport')).toBeFocused();
}

async function shots(page: Page) {
  // Read actual display objects through Pixi's devtools hook, never mutate gameplay state.
  return page.evaluate(() => {
    const probe = window.__weaponProbe;
    const children = probe.application?.stage.children[0]?.children ?? [];
    return children.filter((child) => child.label.startsWith('projectile:') && !child.label.endsWith(':enemy')).map((child) => {
      if (!probe.observed.includes(child)) probe.observed.push(child);
      return { label: child.label, x: child.x, y: child.y, width: child.width, height: child.height };
    });
  });
}

async function fire(page: Page, key: string) {
  await page.keyboard.down(key); await page.clock.runFor(32); await page.keyboard.up(key);
  return shots(page);
}

async function expectDestroyed(page: Page) {
  expect(await shots(page)).toEqual([]);
  expect(await page.evaluate(() => window.__weaponProbe.observed.every((sprite) => sprite.destroyed))).toBe(true);
}

async function ship(page: Page) {
  return page.evaluate(() => {
    const player = window.__weaponProbe.application?.stage.children[0]?.children.find((child) => child.label === 'player');
    if (!player) throw new Error('Missing player sprite');
    return { x: player.x, y: player.y, heading: ((player.rotation - Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) };
  });
}

async function turnTo(page: Page, heading: number) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const difference = ((heading - (await ship(page)).heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(difference) < 0.03) return;
    const key = difference > 0 ? 'd' : 'a';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.max(17, Math.round(Math.abs(difference) / (2.5 / 60)) * 1000 / 60));
    await page.keyboard.up(key);
  }
  expect(Math.abs(((heading - (await ship(page)).heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI)).toBeLessThan(0.03);
}

test('real keys create one front shot and three parallel shots per broadside with independent repeat cooldowns', async ({ page }, testInfo) => {
  await enter(page);
  await page.keyboard.down('Space'); await page.keyboard.down('q'); await page.keyboard.down('e');
  await page.clock.runFor(32);
  const initial = await shots(page);
  expect(initial).toHaveLength(7);
  expect(initial.filter((shot) => shot.label.endsWith(':front'))).toHaveLength(1);
  expect(initial.filter((shot) => shot.label.endsWith(':leftBroadside'))).toHaveLength(3);
  expect(initial.filter((shot) => shot.label.endsWith(':rightBroadside'))).toHaveLength(3);
  expect(initial.every((shot) => shot.width === 10 && shot.height === 10)).toBe(true);
  await page.clock.runFor(100);
  const advanced = await shots(page);
  for (const shot of advanced) {
    const before = initial.find((candidate) => candidate.label === shot.label);
    expect(before).toBeDefined();
    if (!before) throw new Error('Unexpected shot before cooldown');
    const distance = 400 / 10;
    if (shot.label.endsWith(':front')) {
      expect(shot.x).toBe(before.x); expect(shot.y).toBeCloseTo(before.y - distance, 5);
    } else {
      expect(shot.y).toBe(before.y);
      expect(shot.x).toBeCloseTo(before.x + (shot.label.endsWith(':leftBroadside') ? -distance : distance), 5);
    }
  }
  await page.screenshot({ path: testInfo.outputPath('weapons.png'), fullPage: true });
  await page.clock.runFor(200);
  expect(await shots(page)).toHaveLength(7);
  await page.clock.runFor(220);
  const repeated = await shots(page);
  expect(repeated.filter((shot) => shot.label.endsWith(':front'))).toHaveLength(2);
  expect(repeated.filter((shot) => shot.label.endsWith(':leftBroadside'))).toHaveLength(0); // The island stopped them.
  expect(repeated.filter((shot) => shot.label.endsWith(':rightBroadside'))).toHaveLength(3);
  expect(await page.evaluate(() => window.__weaponProbe.observed.filter((shot) => shot.label.endsWith(':leftBroadside'))
    .every((shot) => shot.destroyed))).toBe(true);
  await page.keyboard.up('Space'); await page.keyboard.up('q'); await page.keyboard.up('e');
  await page.clock.runFor(1600);
  await expectDestroyed(page);
});

test('rotated ship-relative origins and parallel directions come from the player transform', async ({ page }) => {
  await enter(page);
  await turnTo(page, Math.PI / 2);
  const player = await ship(page);
  const emitted = await fire(page, 'q');
  expect(emitted).toHaveLength(3);
  for (const [index, shot] of emitted.entries()) {
    const forward = [-24, 0, 24][index];
    const originX = player.x + Math.sin(player.heading) * forward - Math.cos(player.heading) * 38;
    const originY = player.y - Math.cos(player.heading) * forward - Math.sin(player.heading) * 38;
    // At most one fixed step after birth can be rendered during the 32ms delivery.
    expect(Math.abs(shot.x - originX)).toBeLessThanOrEqual(400 / 60 + 0.001);
    expect(Math.abs(shot.y - originY)).toBeLessThanOrEqual(400 / 60 + 0.001);
  }
  await page.clock.runFor(100);
  const moved = await shots(page);
  for (const [index, shot] of moved.entries()) {
    expect(shot.x - emitted[index].x).toBeCloseTo(-Math.cos(player.heading) * 40, 5);
    expect(shot.y - emitted[index].y).toBeCloseTo(-Math.sin(player.heading) * 40, 5);
  }
  await page.getByRole('button', { name: 'Restart Match' }).click();
  await expectDestroyed(page);
  expect(await fire(page, 'Space')).toHaveLength(1);
});

test('lifetime expiration destroys the display object on a clear in-arena route', async ({ page }) => {
  await enter(page);
  await page.keyboard.down('w'); await page.clock.runFor(1450); await page.keyboard.up('w');
  await turnTo(page, Math.PI * 1.5);
  await page.keyboard.down('w'); await page.clock.runFor(3500); await page.keyboard.up('w');
  await turnTo(page, Math.PI / 2);
  const player = await ship(page);
  expect(player.x).toBeLessThan(100); expect(player.y).toBeLessThan(158);
  expect(await fire(page, 'Space')).toHaveLength(1);
  await page.clock.runFor(1900);
  expect(await shots(page)).toHaveLength(1);
  await page.clock.runFor(150);
  await expectDestroyed(page);
});

test('pause freezes shots and remount/end/restart release every owned projectile sprite', async ({ page }) => {
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await enter(page);
    expect(await fire(page, 'e')).toHaveLength(3);
    const before = await shots(page);
    await page.keyboard.press('Escape'); await page.clock.runFor(32);
    const paused = await shots(page);
    expect(paused).toEqual(before);
    await page.clock.fastForward(60_000);
    expect(await shots(page)).toEqual(paused);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(100);
    expect((await shots(page))[0].x).toBeGreaterThan(paused[0].x);
    await page.getByRole('button', { name: 'Restart Match' }).click();
    await expectDestroyed(page);
    expect(await fire(page, 'q')).toHaveLength(3);
    await page.getByRole('button', { name: 'End Match' }).click();
    await expect(page.getByRole('status')).toHaveText('Match ended.');
    await expectDestroyed(page);
    await page.getByRole('button', { name: 'View Result Placeholder' }).click();
    await expect(page.getByRole('heading', { name: 'Result', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await enter(page);
    for (const key of ['w', 'd', 'Space', 'q', 'e']) await page.keyboard.down(key);
    await page.clock.runFor(32);
    for (const key of ['w', 'd', 'Space', 'q', 'e']) await page.keyboard.up(key);
    expect(await shots(page)).toHaveLength(7);
    const moving = await ship(page);
    expect(moving.x).toBeGreaterThan(640); expect(moving.y).toBeLessThan(360); expect(moving.heading).toBeGreaterThan(0);
    // Leave with live projectiles, exercising instance destruction rather than only match end.
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await page.evaluate(() => window.__weaponProbe.observed.every((sprite) => sprite.destroyed))).toBe(true);
  }
});
