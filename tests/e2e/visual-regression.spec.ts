import { test, expect } from './helpers/fixtures';
import { prepareGame, startBattle, readBattle, completeBattle } from './helpers/game';

test.beforeEach(async ({ page }, info) => {
  // Portrait menu/result and supported landscape combat are explicit screenshot states.
  await page.setViewportSize(info.project.name === 'mobile-chromium' ? { width: 393, height: 727 } : { width: 1280, height: 720 });
  await prepareGame(page);
});

test('VISUAL-001 Main Menu', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot('main-menu.png', { fullPage: true });
});

test('VISUAL-002 stable seeded gameplay with real controls', async ({ page }, info) => {
  if (info.project.name === 'mobile-chromium') await page.setViewportSize({ width: 740, height: 360 });
  await startBattle(page);
  await page.keyboard.down('w'); await page.clock.runFor(500); await page.keyboard.up('w');
  await page.clock.runFor(6000);
  const state = await readBattle(page);
  expect(state.snapshot.seed).toBe(1); expect(state.rendered).toHaveLength(2);
  await expect(page.getByRole('definition').nth(1)).toHaveText('0');
  await expect(page).toHaveScreenshot('gameplay.png', { fullPage: true });
});

test('VISUAL-003 real completed and confirmed Result', async ({ page }) => {
  await startBattle(page); await completeBattle(page);
  await page.clock.resume(); // Completed gameplay is stopped; allow MSW registration timers to settle.
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page).toHaveScreenshot('result.png', { fullPage: true });
});
