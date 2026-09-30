import { test, expect } from '@playwright/test';

// Runs against development, preview or a public E2E_BASE_URL with real wall time.
// No devtools owner, seed override or simulation mutation is used.
test('production UI completes a real battle, recovers registration and survives refresh', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('503 (Service Unavailable)')) errors.push(message.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('textbox', { name: 'Game session time' }).fill('60');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Game session time' })).toHaveValue('60');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.evaluate(() => window.pirateBattleNetwork.select('NETWORK-014'));
  if (info.project.name === 'mobile-chromium') await page.setViewportSize({ width: 740, height: 360 });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  if (info.project.name === 'mobile-chromium') await page.getByRole('button', { name: 'Front attack', exact: true }).tap();
  else await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible({ timeout: 75000 });
  await expect(page.getByText('Registration pending. You can retry below or keep playing.')).toBeVisible();
  await page.evaluate(() => window.pirateBattleNetwork.recover());
  await page.getByRole('button', { name: 'Retry registration for' }).click();
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Captain 1');
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Match details');
  const records = await page.evaluate(() => {
    const confirmed: unknown = JSON.parse(localStorage.getItem('pirate-battle:mock-records:v1') ?? '[]');
    const pending: unknown = JSON.parse(localStorage.getItem('pirate-battle:pending-submissions:v1') ?? '[]');
    return { confirmed, pending };
  });
  expect(records.confirmed).toHaveLength(1);
  expect(records.pending).toEqual([]);
  await page.evaluate(() => window.pirateBattleNetwork.select('NETWORK-012'));
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not refresh match history.');
  await page.evaluate(() => window.pirateBattleNetwork.recover());
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(() => window.pirateBattleNetwork.reset());
  await expect(page.getByRole('table')).toContainText('120 seconds');
  expect(errors).toEqual([]);
});
