import { test, expect } from '@playwright/test';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
test('browser MSW intercepts Query/Axios ranking and history, persists submission after refresh', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  const result = await page.evaluate(async (config) => {
    const api = window.pirateBattleNetwork; api.reset();
    const ranking = await api.ranking({ config, page: 1, pageSize: 5 });
    const history = await api.history({ playerId: 'captain-0', page: 1, pageSize: 2 });
    await api.submit({ matchId: 'browser-match', playerId: 'browser-player', playerName: 'Browser Captain', date: '2026-02-01T00:00:00Z', score: 40, durationSeconds: 120, reason: 'timeout', config });
    return { ranking: ranking.total, history: history.total, worker: !!(await navigator.serviceWorker.getRegistration())?.active };
  }, DEFAULT_GAME_CONFIG);
  expect(result).toEqual({ ranking: 24, history: 4, worker: true });
  await page.reload(); await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await window.pirateBattleNetwork.history({ playerId: 'browser-player', page: 1, pageSize: 10 })).total)).toBe(1);
  expect(errors).toEqual([]);
});
