import { expect, test } from './helpers/fixtures';

test('real cannon audio bypasses MSW streaming while ranking still uses the mocked API', async ({ page }) => {
  const images: boolean[] = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image') images.push(response.fromServiceWorker());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  const soundResponse = page.waitForResponse(response => response.url().includes('cannon_fire_1') && response.url().includes('.wav'));
  await page.keyboard.press('Space');
  const sound = await soundResponse;
  expect(sound.ok()).toBe(true);
  expect(sound.fromServiceWorker()).toBe(false);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').getByRole('button', { name: 'Main Menu' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(images.length).toBeGreaterThan(0);
  expect(images.every(fromWorker => !fromWorker)).toBe(true);
  const rankingResponse = page.waitForResponse(response => response.url().includes('/api/ranking'));
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  const ranking = await rankingResponse;
  expect(ranking.ok()).toBe(true);
  expect(ranking.fromServiceWorker()).toBe(true);
  await expect(page.getByRole('table')).toBeVisible();
});
