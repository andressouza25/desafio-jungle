import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Application } from 'pixi.js';

declare global {
  interface Window {
    __pixiProbe: {
      applications: Application[];
      errors: string[];
      observers: Set<ResizeObserver>;
      listeners: Map<EventTarget, Set<EventListenerOrEventListenerObject>>;
    };
  }
}

test.beforeEach(async ({ page }) => {
  // Use Pixi's existing devtools hook; production code exposes no testing API.
  await page.addInitScript(() => {
    const probe: Window['__pixiProbe'] = { applications: [], errors: [], observers: new Set(), listeners: new Map() };
    window.__pixiProbe = probe;
    // ResizeObserver delivery errors dispatch window.error without a JS exception.
    window.addEventListener('error', (event) => probe.errors.push(event.message));
    window.addEventListener('unhandledrejection', (event) => probe.errors.push(String(event.reason)));
    Reflect.set(window, '__PIXI_APP_INIT__', (application: Application) => probe.applications.push(application));
    const NativeResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback);
        probe.observers.add(this);
      }
      disconnect() {
        probe.observers.delete(this);
        super.disconnect();
      }
    };

    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (listener && ((this instanceof MediaQueryList && type === 'change')
        || (this === window && (type === 'resize' || type === 'blur')) || (this === document && type === 'visibilitychange'))) {
        const listeners = probe.listeners.get(this) ?? new Set<EventListenerOrEventListenerObject>();
        listeners.add(listener);
        probe.listeners.set(this, listeners);
      }
      add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      if (listener && (type === 'change' || type === 'resize' || type === 'blur' || type === 'visibilitychange')) probe.listeners.get(this)?.delete(listener);
      remove.call(this, type, listener, options);
    };
  });
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__pixiProbe.errors)).toEqual([]);
});

function trackBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function resources(page: Page) {
  return page.evaluate(() => {
    const probe = window.__pixiProbe;
    const active = probe.applications.filter((application) => Boolean(application.renderer));
    return {
      applications: active.length,
      observers: probe.observers.size,
      listeners: [...probe.listeners.values()].reduce((total, listeners) => total + listeners.size, 0),
      tickerCallbacks: active.reduce((total, application) => total + application.ticker.count, 0),
      runningTickers: active.filter((application) => application.ticker.started).length,
    };
  });
}

async function expectClean(page: Page) {
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(() => resources(page)).toEqual({ applications: 0, observers: 0, listeners: 0, tickerCallbacks: 0, runningTickers: 0 });
}

async function expectCanvasSizing(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const application = window.__pixiProbe.applications.find((candidate) => Boolean(candidate.renderer));
    const host = document.querySelector('[data-testid="arena-viewport"]');
    if (!application || !(host instanceof HTMLElement)) return false;
    const canvas = application.canvas;
    const world = application.stage.children[0];
    const scale = Math.min(host.clientWidth / 1280, host.clientHeight / 720);
    // Pixi rounds its backing texture to integer physical pixels at fractional DPR.
    const screenTolerance = 0.51 / devicePixelRatio;
    return {
      screenWidth: Math.abs(application.screen.width - host.clientWidth) <= screenTolerance,
      screenHeight: Math.abs(application.screen.height - host.clientHeight) <= screenTolerance,
      pixelWidth: Math.abs(canvas.width - host.clientWidth * devicePixelRatio) <= 1,
      pixelHeight: Math.abs(canvas.height - host.clientHeight * devicePixelRatio) <= 1,
      scale: Math.abs(world.scale.x - scale) < 0.001 && world.scale.x === world.scale.y,
      bounds: world.x >= 0 && world.y >= 0
        && world.x + 1280 * scale <= host.clientWidth + 0.01
        && world.y + 720 * scale <= host.clientHeight + 0.01,
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
    };
  })).toEqual({ screenWidth: true, screenHeight: true, pixelWidth: true, pixelHeight: true, scale: true, bounds: true, noOverflow: true });
}

test('loads reusable water and environment and cleans up five mount cycles, resizing and DPR changes', async ({ page, context, isMobile }, testInfo) => {
  const errors = trackBrowserErrors(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  let waterRequests = 0;
  let environmentRequests = 0;
  let projectileRequests = 0;
  page.on('request', (request) => {
    if (/\/retina\/tiles\/tile_73\.png$/.test(request.url())) waterRequests += 1;
    if (/\/tilesheet\/tiles_sheet\.png$/.test(request.url())) environmentRequests += 1;
    if (/cannon_ball.*\.png/.test(request.url()) && !request.url().includes('?import')) projectileRequests += 1;
  });

  for (let cycle = 0; cycle < 5; cycle += 1) {
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Arena ready. No match is running.');
    await expect(page.getByRole('img', { name: 'Water arena' })).toHaveCount(1);
    // One host observer belongs to ArenaRenderer; Pixi's DOM pipe owns a canvas observer.
    expect(await resources(page)).toEqual({ applications: 1, observers: 2, listeners: 4, tickerCallbacks: 2, runningTickers: 0 });
    await expectCanvasSizing(page);

    if (cycle === 0) {
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
        await page.setViewportSize(viewport);
        await expectCanvasSizing(page);
        await page.screenshot({ path: testInfo.outputPath(`arena-${viewport.width}.png`), fullPage: true });
      }
      for (let resize = 0; resize < 10; resize += 1) {
        await page.setViewportSize({ width: 390 + resize, height: 844 - resize });
      }
      await expectCanvasSizing(page);
      if (!isMobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 2, mobile: false });
        await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBe(2);
        await expectCanvasSizing(page);
        expect((await resources(page)).listeners).toBe(4);
        await cdp.send('Emulation.clearDeviceMetricsOverride');
        await cdp.detach();
        await expectCanvasSizing(page);
      }
    }
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expectClean(page);
  }
  expect(waterRequests).toBe(1);
  expect(environmentRequests).toBe(1);
  expect(projectileRequests).toBe(1);
  expect(errors).toEqual([]);
});

for (const asset of ['tile_73', 'ship_2', 'tiles_sheet', 'cannon_ball', 'ship_1', 'ship_3']) {
  test(`shows ${asset} failure and recovers through the visible retry control`, async ({ page }) => {
    const errors = trackBrowserErrors(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    let shouldFail = true;
    let requests = 0;
    // MSW's fetch handler owns the page request; intercept its external asset fetch.
    // Do not route /api or block service workers: API tests must retain MSW.
    await page.context().route(`**/*${asset}*.png*`, async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('import') || (asset === 'tile_73' && !url.pathname.includes('/retina/tiles/'))) {
        await route.continue(); return;
      }
      requests += 1;
      if (shouldFail) await route.fulfill({ status: 200, contentType: 'image/png', body: 'invalid image data' });
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('The game assets could not be loaded. Please try again.');
    await expect(page.locator('canvas')).toHaveCount(0);
    expect((await resources(page)).applications).toBe(0);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Main Menu', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    const retry = page.getByRole('button', { name: 'Retry Loading' });
    await expect(retry).toBeFocused();
    expect(await retry.evaluate((button) => getComputedStyle(button).outlineStyle)).not.toBe('none');
    shouldFail = false;
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('Arena ready. No match is running.');
    await expect(page.getByRole('img', { name: 'Water arena' })).toBeVisible();
    expect(requests).toBe(2);
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expectClean(page);
    expect(errors).toEqual([]);
  });
}

test('leaving during asset loading prevents late canvases and shares the in-flight request', async ({ page }) => {
  const errors = trackBrowserErrors(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  await page.context().route('**/retina/tiles/tile_73.png', async (route) => {
    requests += 1;
    await gate;
    await route.continue();
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Loading game assets…');
  await expect(page.getByRole('progressbar', { name: 'Game assets' })).toBeVisible();
  // Player, both enemies, environment and projectile complete while water is held.
  await expect(page.getByRole('progressbar', { name: 'Game assets' })).toHaveAttribute('value', String(5 / 6));
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expectClean(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  release();
  await expect(page.getByRole('status')).toHaveText('Arena ready. No match is running.');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(requests).toBe(1);
  expect((await resources(page)).applications).toBe(1);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expectClean(page);
  expect(errors).toEqual([]);
});
