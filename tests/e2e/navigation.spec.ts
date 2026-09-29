import { expect, test } from '@playwright/test';

test('reaches and exits every placeholder screen', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto('/');

  for (const title of ['Options', 'Ranking', 'Match History']) {
    await page.getByRole('button', { name: title }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();
  }

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Game' })).toBeVisible();
    await page.getByRole('button', { name: 'View Result Placeholder' }).click();
    await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();
    await page.getByRole('button', { name: 'Play Again' }).click();
    await expect(page.getByRole('heading', { name: 'Game' })).toBeVisible();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'View Result Placeholder' }).click();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('supports keyboard navigation and moves focus to the active screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Options' })).toBeFocused();
  const focusOutline = await page.getByRole('button', { name: 'Options' }).evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(focusOutline).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Main Menu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Game' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'View Result Placeholder' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();
});
