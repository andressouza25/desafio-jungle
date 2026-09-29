import { expect, test } from '@playwright/test';

test('validates settings and persists only valid saves after reload', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const duration = page.getByRole('textbox', { name: 'Game session time' });
  const spawn = page.getByRole('textbox', { name: 'Enemy spawn time' });
  await expect(duration).toHaveValue('120');
  await expect(spawn).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();

  await duration.fill('59');
  await spawn.fill('0');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(duration).toHaveAttribute('aria-invalid', 'true');
  await expect(spawn).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter a whole number from 60 to 180 seconds.')).toBeVisible();
  await expect(page.getByText('Enter a whole number from 1 to 30 seconds.')).toBeVisible();

  await duration.fill('181');
  await spawn.fill('31');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(duration).toHaveAttribute('aria-invalid', 'true');
  await expect(spawn).toHaveAttribute('aria-invalid', 'true');

  await duration.fill('90.5');
  await spawn.fill('abc');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(duration).toHaveAttribute('aria-invalid', 'true');
  await expect(spawn).toHaveAttribute('aria-invalid', 'true');

  await duration.fill('180');
  await spawn.fill('5');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('status')).toContainText('Settings saved');
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  await page.reload();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(duration).toHaveValue('180');
  await expect(spawn).toHaveValue('5');
  await expect(page.getByRole('button', { name: 'Increase Game session time' })).toBeDisabled();
  await page.getByRole('button', { name: 'Decrease Game session time' }).click();
  await expect(duration).toHaveValue('179');
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(duration).toHaveValue('180');
  expect(browserErrors).toEqual([]);
});

test('menu and options remain keyboard-usable with visible focus and no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Options', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Decrease Game session time' })).toBeFocused();
  const outline = await page.getByRole('button', { name: 'Decrease Game session time' }).evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(outline).not.toBe('none');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Game session time' })).toBeFocused();

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noHorizontalOverflow).toBe(true);
});
