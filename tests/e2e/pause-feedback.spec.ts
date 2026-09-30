import { expect, test } from '@playwright/test';

test('pause dialog contains keyboard focus, restores gameplay focus, and freezes held attacks across long gaps', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.keyboard.down('w'); await page.keyboard.down('Space'); await page.clock.runFor(100);
  await page.keyboard.press('Escape'); await page.clock.runFor(32);
  const dialog = page.getByRole('dialog', { name: 'Paused' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Resume' })).toBeFocused();
  const time = await page.getByRole('definition').nth(2).textContent();
  await page.clock.fastForward(60000);
  expect(await page.getByRole('definition').nth(2).textContent()).toBe(time);
  await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Main Menu' })).toBeFocused();
  await page.keyboard.press('Tab');
  // Native dialog may include a browser focus sentinel; focus must never reach background controls.
  expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await dialog.getByRole('button', { name: 'Resume' }).focus();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('pause-dialog.png'), fullPage: true });
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('arena-viewport')).toBeFocused();
  await page.keyboard.up('w'); await page.keyboard.up('Space');
  await page.getByTestId('arena-viewport').evaluate(host => host.blur());
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByTestId('arena-viewport')).toBeFocused();
  await page.keyboard.press('Tab'); // Page controls retain their normal behavior.
  await page.getByRole('button', { name: 'Main Menu', exact: true }).focus();
  await page.keyboard.press('Enter'); await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('audio rejects autoplay safely, bounds voices, warns once, and stops owned loops', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const audioPath = '/src/game/feedback/GameAudio.ts';
    const { GameAudio }: typeof import('../../src/game/feedback/GameAudio') = await import(audioPath);
    const configPath = '/src/game/config/GameConfig.ts';
    const { DEFAULT_GAME_CONFIG }: typeof import('../../src/game/config/GameConfig') = await import(configPath);
    const controllerPath = '/src/game/core/GameController.ts';
    const { GameController }: typeof import('../../src/game/core/GameController') = await import(controllerPath);
    const voices: HTMLAudioElement[] = [];
    const audio = new GameAudio(() => {
      const element = document.createElement('audio');
      element.play = () => Promise.resolve();
      voices.push(element); return element;
    });
    const controller = new GameController({ readConfig: () => DEFAULT_GAME_CONFIG }); controller.markReady(); controller.start();
    audio.sync(controller.getSnapshot()); audio.play('ui_click');
    const locked = voices.length;
    audio.unlock(); const loops = voices.filter(voice => voice.loop).length;
    for (let i = 0; i < 100; i++) audio.react({ kind: 'fire', x: 0, y: 0, time: 0 });
    const shots = voices.filter(voice => voice.dataset.sound === 'cannon_fire_1').length;
    const snapshot = { ...controller.getSnapshot(), playerHealth: 20, remainingSeconds: 5 };
    audio.sync(snapshot); audio.sync(snapshot);
    const warnings = voices.filter(voice => voice.dataset.sound === 'health_low' || voice.dataset.sound === 'time_warning').length;
    controller.pause(); audio.sync(controller.getSnapshot()); audio.destroy();
    const cleared = voices.every(voice => !voice.getAttribute('src'));
    const count = voices.length; audio.unlock(); audio.play('ui_click');
    const terminal = voices.length === count;
    const rejected = new GameAudio(() => {
      const element = document.createElement('audio'); element.play = () => Promise.reject(new Error('autoplay denied')); return element;
    });
    rejected.sync(snapshot); rejected.unlock(); rejected.play('ui_click'); await Promise.resolve(); rejected.destroy();
    return { locked, loops, shots, warnings, cleared, terminal };
  });
  expect(result).toEqual({ locked: 0, loops: 2, shots: 2, warnings: 2, cleared: true, terminal: true });
});

test('five mounted sessions own and release audio resources without duplicate loops', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = Audio;
    const owned: HTMLAudioElement[] = [];
    Reflect.set(window, '__ownedAudio', owned);
    window.Audio = class extends NativeAudio {
      constructor(src?: string) { super(src); owned.push(this); }
    };
  });
  await page.clock.install({ time: '2026-01-01T00:00:00Z' });
  await page.goto('/'); await page.clock.pauseAt('2026-01-01T00:01:00Z');
  const loops = () => page.evaluate(() => {
    const owned: unknown = Reflect.get(window, '__ownedAudio');
    if (!Array.isArray(owned)) throw new Error('Missing audio observation');
    return owned.filter((audio: unknown) => audio instanceof HTMLAudioElement && audio.loop && audio.hasAttribute('src')).length;
  });
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Start Match' }).click();
    await expect.poll(loops).toBe(2);
    await page.keyboard.press('Space'); await page.clock.runFor(32);
    await page.keyboard.press('Escape'); await page.clock.runFor(32);
    await expect(page.getByRole('dialog')).toBeVisible(); expect(await loops()).toBe(0);
    await page.getByRole('button', { name: 'Resume', exact: true }).click(); await expect.poll(loops).toBe(2);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.getByRole('dialog').getByRole('button', { name: 'Main Menu' }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await page.evaluate(() => {
      const owned: unknown = Reflect.get(window, '__ownedAudio');
      return Array.isArray(owned) && owned.every((audio: unknown) => audio instanceof HTMLAudioElement && audio.paused && !audio.hasAttribute('src'));
    })).toBe(true);
  }
});
