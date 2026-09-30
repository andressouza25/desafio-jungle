/* global window, document, navigator, performance, innerWidth, innerHeight, devicePixelRatio, console, process */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';

// External observation only: never change the simulation clock or balance.
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.addInitScript(() => {
  const probe = { app: null, instance: null, frames: [], counts: [], commits: 0 };
  window.profileProbe = probe;
  window.__PIXI_APP_INIT__ = app => { probe.app = app; };
  function inspect(fiber, depth = 0) {
    if (!fiber || depth > 50) return;
    for (let hook = fiber.memoizedState, i = 0; hook && i < 30; hook = hook.next, i++) {
      const current = hook.memoizedState?.current;
      if (current?.controller?.getEnemyStates) probe.instance = current;
    }
    inspect(fiber.child, depth + 1); inspect(fiber.sibling, depth + 1);
  }
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, renderers: new Map(), inject() { return 1; },
    onCommitFiberRoot(id, root) { void id; probe.commits++; inspect(root.current); },
    onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
  };
});
await page.goto(process.env.PROFILE_URL ?? 'http://127.0.0.1:4173');
await page.getByRole('button', { name: 'Options', exact: true }).click();
await page.getByRole('textbox', { name: 'Game session time' }).fill('180');
await page.getByRole('button', { name: 'Save Changes' }).click();
await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
async function start() {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await page.getByRole('status').filter({ hasText: 'Match running.' }).waitFor();
}
await start();
const environment = await page.evaluate(() => {
  const p = window.profileProbe;
  if (!p.instance || !p.app) throw new Error('Production observation unavailable');
  const gl = p.app.renderer.gl;
  const extension = gl.getExtension('WEBGL_debug_renderer_info');
  return { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
    gpu: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unavailable',
    config: p.instance.controller.getSnapshot().config };
});
await page.evaluate(() => {
  const p = window.profileProbe;
  let previous = null;
  p.frameListener = () => {
    const now = performance.now();
    if (previous !== null) p.frames.push(now - previous);
    previous = now;
  };
  p.app.ticker.add(p.frameListener);
});
const began = Date.now();
// Navigate around the island, then use its cover. All three weapons remain
// held; enemies, collisions, feedback, audio and terminal rules stay enabled.
const waypoints = [[640, 120], [120, 120], [120, 320]];
let waypoint = 0;
let turning = null;
let moving = true;
for (const key of ['w', 'Space', 'q', 'e']) await page.keyboard.down(key);
let lastSample = -1;
while (Date.now() - began < Number(process.env.PROFILE_MAX_WALL_MS ?? 205000)) {
  const state = await page.evaluate(() => {
    const c = window.profileProbe.instance.controller;
    return { snapshot: c.getSnapshot(), player: c.getPlayerState() };
  });
  if (state.snapshot.state !== 'running') break;
  const [x, y] = waypoints[waypoint];
  if (Math.hypot(x - state.player.x, y - state.player.y) < 20) {
    waypoint = Math.min(waypoint + 1, waypoints.length - 1);
  }
  const target = waypoints[waypoint];
  const arrived = waypoint === waypoints.length - 1 && Math.hypot(target[0] - state.player.x, target[1] - state.player.y) < 20;
  const heading = arrived ? Math.PI / 2 : Math.atan2(target[0] - state.player.x, -(target[1] - state.player.y));
  const error = Math.atan2(Math.sin(heading - state.player.rotation), Math.cos(heading - state.player.rotation));
  const move = !arrived && Math.abs(error) < .15;
  if (move !== moving) { await page.keyboard[move ? 'down' : 'up']('w'); moving = move; }
  const next = Math.abs(error) < 0.12 ? null : error > 0 ? 'd' : 'a';
  if (next !== turning) {
    if (turning) await page.keyboard.up(turning);
    if (next) await page.keyboard.down(next);
    turning = next;
  }
  const second = Math.floor(state.snapshot.elapsedSeconds);
  if (second !== lastSample) {
    lastSample = second;
    await page.evaluate(() => {
      const p = window.profileProbe, c = p.instance.controller;
      p.counts.push({ second: c.getSnapshot().elapsedSeconds, enemies: c.getEnemyStates().length,
        projectiles: c.getProjectileStates().length, player: c.getPlayerState() ? 1 : 0 });
    });
    if (second % 30 === 0) console.log(`Profile: ${second}s active; health ${state.player.health}; position ${Math.round(state.player.x)},${Math.round(state.player.y)}`);
  }
  await page.waitForTimeout(100);
}
for (const key of ['w', 'Space', 'q', 'e', 'a', 'd']) await page.keyboard.up(key);
const profile = await page.evaluate(() => {
  const p = window.profileProbe;
  p.app.ticker?.remove(p.frameListener);
  const sorted = [...p.frames].sort((a, b) => a - b);
  const total = p.frames.reduce((a, b) => a + b, 0);
  return { snapshot: p.instance.controller.getSnapshot(), frames: p.frames.length,
    fps: p.frames.length * 1000 / total, p95Ms: sorted[Math.ceil(sorted.length * .95) - 1],
    counts: p.counts, commits: p.commits, rawFrameIntervalsMs: p.frames };
});
if (await page.getByRole('heading', { name: 'Battle Complete' }).isVisible()) {
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
} else {
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').getByRole('button', { name: 'Main Menu' }).click();
}
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
async function resources() {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const selected = Object.fromEntries(metrics.filter(m => ['JSHeapUsedSize', 'Nodes', 'Documents', 'JSEventListeners'].includes(m.name)).map(m => [m.name, m.value]));
  const owned = await page.evaluate(() => {
    const p = window.profileProbe, i = p.instance, r = i.renderer;
    return { canvases: document.querySelectorAll('canvas').length, destroyed: i.destroyed,
      application: Boolean(r.application), enemies: r.enemies.size, projectiles: r.projectiles.size,
      health: r.health.size, effects: Boolean(r.feedback), observer: Boolean(r.observer),
      densityListener: Boolean(r.densityQuery), pendingResize: r.resizeFrame !== null,
      keyboardDestroyed: i.keyboard.destroyed, touchActive: i.touch.active, touchPointers: i.touch.pointers.size,
      inputOwners: i.controller.input.held.size, pauseRequests: i.controller.input.pauseRequests.size,
      audioVoices: i.audio.voices.size, audioLoops: i.audio.loops.size,
      simulationListeners: i.controller.listeners.size, feedbackListeners: i.controller.feedbackListeners.size };
  });
  return { ...selected, ...owned };
}
const baseline = await resources();
async function heapSnapshot(name) {
  if (!process.env.PROFILE_HEAP) return;
  const chunks = [];
  const append = event => chunks.push(event.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', append);
  await cdp.send('HeapProfiler.takeHeapSnapshot');
  cdp.off('HeapProfiler.addHeapSnapshotChunk', append);
  await mkdir('output/playwright', { recursive: true });
  await writeFile(`output/playwright/task-17-${name}.heapsnapshot`, chunks.join(''));
}
await heapSnapshot('before');
const cycles = [];
for (let cycle = 1; cycle <= Number(process.env.PROFILE_CYCLES ?? 5); cycle++) {
  await start();
  await page.keyboard.down('w'); await page.keyboard.down('Space');
  await page.waitForTimeout(5000);
  await page.keyboard.up('w'); await page.keyboard.up('Space');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').getByRole('button', { name: 'Main Menu' }).click();
  await page.waitForTimeout(1000);
  cycles.push({ cycle, ...await resources() });
  console.log(`Lifecycle cycle ${cycle}: complete`);
}
await heapSnapshot('after');
const output = { date: new Date().toISOString(), environment: { ...environment, browser: browser.version(),
  os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length,
  ramBytes: os.totalmem(), mode: 'optimized production', headless: true },
  completedThreeMinuteMatch: profile.snapshot.result?.reason === 'timeout' && Math.abs(profile.snapshot.elapsedSeconds - 180) < .001,
  profile, baseline, cycles, errors };
await mkdir('output/playwright', { recursive: true });
await writeFile(`output/playwright/task-17-profile${process.env.PROFILE_ROUTE ? `-${process.env.PROFILE_ROUTE}` : ''}.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ fps: profile.fps, p95Ms: profile.p95Ms, duration: profile.snapshot.elapsedSeconds, cycles, errors }, null, 2));
await browser.close();
if (errors.length || (!output.completedThreeMinuteMatch && !process.env.PROFILE_MAX_WALL_MS)) process.exitCode = 1;
