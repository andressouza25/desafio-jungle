import { test, expect } from './helpers/fixtures';
import { prepareGame, setOptions, startBattle, completeBattle } from './helpers/game';

test.beforeEach(async ({ page }) => { await prepareGame(page); });

test('real registration refreshes warmed Ranking and History tabs with the completed battle', async ({ page }) => {
  await page.clock.resume(); // MSW delay(0) still uses a timer; keep network timers runnable in menus.
  await setOptions(page, 60, 30);
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByText('No ranked battles for this configuration yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.clock.pauseAt('2026-09-30T00:02:00Z');
  await startBattle(page); await completeBattle(page);
  await page.clock.resume();
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  const record = await page.evaluate(() => {
    const value: unknown = JSON.parse(localStorage.getItem('pirate-battle:last-result:v1') ?? 'null');
    if (!value || typeof value !== 'object' || !('matchId' in value) || typeof value.matchId !== 'string') throw new Error('Missing completed ID');
    if (!('durationSeconds' in value) || typeof value.durationSeconds !== 'number') throw new Error('Missing duration');
    return { matchId: value.matchId, durationSeconds: value.durationSeconds };
  });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('rowheader')).toContainText('Captain 1');
  await expect(page.getByRole('row').nth(1)).toContainText('0');
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByText('Page 1 of 3', { exact: true })).toBeVisible();
  await page.getByText('Match details', { exact: true }).first().click();
  await expect(page.getByText(record.matchId, { exact: true })).toBeVisible();
  expect(record.durationSeconds).toBeCloseTo(60, 8);
  await expect(page.getByRole('row').nth(1)).toContainText(`${record.durationSeconds} seconds`);
});

test('refresh abandons an active match without creating a result, pending submission or server record', async ({ page }) => {
  await startBattle(page);
  await page.keyboard.down('w'); await page.keyboard.down('Space'); await page.clock.runFor(500);
  await page.keyboard.up('w'); await page.keyboard.up('Space');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
  expect(await page.evaluate(() => ['pirate-battle:last-result:v1', 'pirate-battle:pending-submissions:v1', 'pirate-battle:mock-records:v1']
    .map(key => localStorage.getItem(key)))).toEqual([null, null, null]);
  await startBattle(page);
  await expect(page.getByRole('definition').first()).toHaveText('100 / 100');
  await expect(page.getByRole('definition').nth(1)).toHaveText('0');
  await expect(page.getByRole('definition').nth(2)).toHaveText('02:00');
});
