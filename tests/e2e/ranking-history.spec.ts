import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import type { ScenarioId } from '../../src/mocks/scenarios';

async function open(page: Page, title: 'Ranking' | 'Match History', scenario: ScenarioId = 'NETWORK-001') {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate((id) => {
    const api = window.pirateBattleNetwork;
    api.reset();
    api.select(id);
  }, scenario);
  await page.getByRole('button', { name: title, exact: true }).click();
}

for (const title of ['Ranking', 'Match History'] as const) {
  test(`${title}: server pages, required fields, responsive semantics and keyboard`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await open(page, title, 'NETWORK-003');
    const totalPages = title === 'Ranking' ? 5 : 2;
    await expect(page.getByText(`Page 1 of ${totalPages}`, { exact: true })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    if (title === 'Ranking') {
      await expect(table.getByRole('rowheader').first()).toContainText('Captain 1');
      await expect(table.getByRole('row').nth(1)).toContainText('20');
      await expect(table).toContainText('captain-0');
      await page.getByText('Gameplay configuration', { exact: true }).click();
      await expect(page.getByText('Shooter: Attack Range', { exact: true })).toBeVisible();
      await page.getByText('Gameplay configuration', { exact: true }).click();
    } else {
      await expect(table).toContainText('120 seconds');
      await expect(table).toContainText('Time up');
      await table.getByText('Match details', { exact: true }).first().click();
      await expect(table).toContainText('fixture-18');
      await expect(table).toContainText('captain-0');
      await table.getByText('Gameplay configuration', { exact: true }).first().click();
      await expect(table.getByText('Shooter: Attack Range', { exact: true }).first()).toBeVisible();
      await table.getByText('Match details', { exact: true }).first().click();
    }
    const firstPage = await table.innerText();
    await page.getByRole('button', { name: 'Next page' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Next page' })).toBeFocused();
    expect(await page.getByRole('button', { name: 'Next page' }).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.getByText(`Page 2 of ${totalPages}`, { exact: true })).toBeVisible();
    expect(await table.innerText()).not.toBe(firstPage);
    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText(`Page 1 of ${totalPages}`, { exact: true })).toBeVisible();
    expect(await table.innerText()).toBe(firstPage);
    await page.screenshot({ path: testInfo.outputPath(`${title}-reference.png`), fullPage: true });
    for (const size of [{ width: 390, height: 844 }, { width: 568, height: 320 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(size);
      await expect(table.getByRole('rowheader').first()).toBeVisible();
      for (const cell of await table.getByRole('row').nth(1).locator('th, td').all()) await expect(cell).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText(`Page 2 of ${totalPages}`, { exact: true })).toBeVisible();
    for (let current = 2; current < totalPages; current++) {
      await page.getByRole('button', { name: 'Next page' }).click();
      await expect(page.getByText(`Page ${current + 1} of ${totalPages}`, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test(`${title}: empty, initial latency, refresh, cache return and retry`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Chromium logs failed HTTP resources; expected 503 diagnostics are not application exceptions.
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text()); });
    await open(page, title, 'NETWORK-002');
    await expect(page.getByText('No pages', { exact: true })).toBeVisible();
    await expect(page.getByText(title === 'Ranking' ? 'No ranked battles for this configuration yet.' : 'No completed battles yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await page.evaluate(() => { window.pirateBattleNetwork.reset(); window.pirateBattleNetwork.select('NETWORK-004'); });
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByText(`Loading ${title.toLowerCase()}…`, { exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    const content = await page.getByRole('table').innerText();
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText(`Updating ${title.toLowerCase()}…`, { exact: true })).toBeVisible();
    expect(await page.getByRole('table').innerText()).toBe(content);
    await expect(page.getByText(`Updating ${title.toLowerCase()}…`, { exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(`Updating ${title.toLowerCase()}…`, { exact: true })).toBeVisible();
    await expect(page.getByText(`Updating ${title.toLowerCase()}…`, { exact: true })).toBeHidden();
    await page.evaluate((ranking) => window.pirateBattleNetwork.select(ranking ? 'NETWORK-011' : 'NETWORK-012'), title === 'Ranking');
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Could not refresh');
    await expect(page.getByRole('table')).toBeVisible();
    await page.evaluate(() => window.pirateBattleNetwork.recover());
    await page.getByRole('button', { name: 'Retry', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await page.evaluate((ranking) => { window.pirateBattleNetwork.reset(); window.pirateBattleNetwork.select(ranking ? 'NETWORK-011' : 'NETWORK-012'); }, title === 'Ranking');
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Could not load');
    await page.evaluate(() => window.pirateBattleNetwork.recover());
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${title}: old page responses cannot replace the requested page`, async ({ page }) => {
    await open(page, title);
    const totalPages = title === 'Ranking' ? 5 : 2;
    await expect(page.getByText(`Page 1 of ${totalPages}`, { exact: true })).toBeVisible();
    const initial = await page.getByRole('table').innerText();
    await page.evaluate(() => window.pirateBattleNetwork.select('NETWORK-006', [800, 100]));
    const second = page.waitForRequest((request) => request.url().includes('/api/') && new URL(request.url()).searchParams.get('page') === '2');
    await page.getByRole('button', { name: 'Next page' }).click();
    await second;
    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText(`Page 1 of ${totalPages}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`Updating ${title.toLowerCase()}…`, { exact: true })).toBeHidden();
    // A fresh probe waits beyond the old delayed request while exercising variable latency.
    await page.evaluate(async () => { window.pirateBattleNetwork.select('NETWORK-005', [900]); await window.pirateBattleNetwork.history({ playerId: 'unrelated', page: 1, pageSize: 1 }); });
    expect(await page.getByRole('table').innerText()).toBe(initial);
    await expect(page.getByText(`Page 1 of ${totalPages}`, { exact: true })).toBeVisible();
  });
}

test('ranking configuration identity follows saved Options and keeps old contexts separate', async ({ page }) => {
  await open(page, 'Ranking');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await page.evaluate(() => localStorage.setItem('pirate-battle:options:v1', JSON.stringify({ sessionDurationSeconds: 60, enemySpawnIntervalSeconds: 3 })));
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByText('60 second battles · 3 second spawn interval')).toBeVisible();
  await expect(page.getByText('No ranked battles for this configuration yet.')).toBeVisible();
  expect(await page.evaluate(async (config) => (await window.pirateBattleNetwork.ranking({ config, page: 1, pageSize: 5 })).total, DEFAULT_GAME_CONFIG)).toBe(24);
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Match History', exact: true })).toBeAttached();
  await expect(page.getByRole('table')).toBeVisible();
});

