import { expect, test } from '@playwright/test';

test('loads the bootstrap entry without browser errors', async ({ page }) => {
  const browserErrors: string[] = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible();
  await expect(page.getByText('Main Menu placeholder.')).toBeVisible();
  expect(browserErrors).toEqual([]);
});
