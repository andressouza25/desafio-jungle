import { expect, test, type Page } from '@playwright/test';
import type { GameController } from '../../src/game/core/GameController';
import type { ScenarioId } from '../../src/mocks/scenarios';
import { PENDING_SUBMISSIONS_KEY } from '../../src/storage/pendingSubmissions';
import { MOCK_RECORDS_KEY } from '../../src/storage/mockRecords';
import type { MatchRecord } from '../../src/api/contracts';

async function installSimulationObservation(page: Page) {
  await page.addInitScript(() => {
    const probe: Window['__enemyProbe'] = { app: null, commits: 0, controller: null, observed: [] };
    window.__enemyProbe = probe;
    function inspect(value: unknown, depth = 0): void {
      if (!value || typeof value !== 'object' || depth > 50) return;
      let hook: unknown = Reflect.get(value, 'memoizedState');
      for (let i = 0; i < 20 && hook && typeof hook === 'object'; i++) {
        const state: unknown = Reflect.get(hook, 'memoizedState');
        if (state && typeof state === 'object') {
          const current: unknown = Reflect.get(state, 'current');
          if (current && typeof current === 'object') {
            const controller: unknown = Reflect.get(current, 'controller');
            if (controller && typeof controller === 'object' && typeof Reflect.get(controller, 'getEnemyStates') === 'function')
              probe.controller = controller as GameController;
          }
        }
        hook = Reflect.get(hook, 'next');
      }
      inspect(Reflect.get(value, 'child'), depth + 1); inspect(Reflect.get(value, 'sibling'), depth + 1);
    }
    Reflect.set(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      supportsFiber: true, renderers: new Map(), inject() { return 1; },
      onCommitFiberRoot(_id: number, root: unknown) { if (root && typeof root === 'object') inspect(Reflect.get(root, 'current')); },
      onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    });
  });
}

async function select(page: Page, scenario: ScenarioId) {
  await page.evaluate(id => window.pirateBattleNetwork.select(id), scenario);
}
async function persisted(page: Page, key: string): Promise<MatchRecord[]> {
  return page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) ?? '[]'), key);
}
async function completeRealMatch(page: Page) {
  await page.evaluate(() => { for (let i = 0; i < 1300; i++) window.__enemyProbe.controller?.advance(100); });
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await installSimulationObservation(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
});

test('completed match confirms once; active and abandoned matches never submit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  expect(await persisted(page, MOCK_RECORDS_KEY)).toEqual([]);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  expect(await persisted(page, MOCK_RECORDS_KEY)).toEqual([]);
  expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([]);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await completeRealMatch(page);
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  const [record] = await persisted(page, MOCK_RECORDS_KEY);
  expect(record.matchId).toBeTruthy(); expect(record.playerId).toBe('captain-0');
  expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([]);
  await page.reload();
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  expect(await persisted(page, MOCK_RECORDS_KEY)).toEqual([record]);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await page.getByText('Match details', { exact: true }).first().click();
  await expect(page.getByText(record.matchId, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const scenario of ['NETWORK-008', 'NETWORK-014', 'NETWORK-013'] as const) {
  test(`${scenario}: completed match remains pending across refresh and safely retries`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const attemptedIds: string[] = [];
    page.on('request', request => {
      if (request.method() !== 'POST' || !request.url().endsWith('/api/matches')) return;
      const payload: unknown = JSON.parse(request.postData() ?? 'null');
      if (payload && typeof payload === 'object' && 'matchId' in payload && typeof payload.matchId === 'string')
        attemptedIds.push(payload.matchId);
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text());
    });
    await select(page, scenario);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Start Match' }).click();
    await completeRealMatch(page);
    const retry = page.getByRole('button', { name: /^Retry registration for/ });
    await expect(retry).toBeEnabled();
    const [record] = await persisted(page, PENDING_SUBMISSIONS_KEY);
    expect((await persisted(page, MOCK_RECORDS_KEY)).filter(item => item.matchId === record.matchId)).toHaveLength(scenario === 'NETWORK-013' ? 1 : 0);
    await page.screenshot({ path: testInfo.outputPath('pending-result.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Play Again' }).click();
    await expect(page.getByRole('status')).toHaveText('Match running.');
    expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([record]);
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expect(retry).toBeEnabled();
    await page.reload();
    await expect(retry).toBeEnabled();
    expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([record]);
    // Refresh restores the queue but requires explicit manual retry.
    await page.evaluate(() => window.pirateBattleNetwork.recover());
    await select(page, 'NETWORK-004');
    await retry.focus(); await page.keyboard.press('Enter');
    await retry.evaluate(button => { if (button instanceof HTMLButtonElement) { button.click(); button.click(); } });
    await expect(retry).toBeDisabled();
    await expect(page.getByText('Submitting registration…', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
    expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([]);
    expect((await persisted(page, MOCK_RECORDS_KEY)).filter(item => item.matchId === record.matchId)).toEqual([record]);
    await page.evaluate(async match => {
      await Promise.all([window.pirateBattleNetwork.submit(match), window.pirateBattleNetwork.submit(match)]);
    }, record);
    expect(await persisted(page, MOCK_RECORDS_KEY)).toEqual([record]);
    const counts = await page.evaluate(async match => {
      const history = await window.pirateBattleNetwork.history({ playerId: match.playerId, page: 1, pageSize: 100 });
      const ranking = await window.pirateBattleNetwork.ranking({ config: match.config, page: 1, pageSize: 100 });
      return [history.items.filter(item => item.matchId === match.matchId).length, ranking.items.filter(item => item.matchId === match.matchId).length];
    }, record);
    expect(counts).toEqual([1, 1]);
    expect(attemptedIds.length).toBeGreaterThanOrEqual(4);
    expect(new Set(attemptedIds)).toEqual(new Set([record.matchId]));
    expect(errors).toEqual([]);
  });
}

test('two completed pending battles keep distinct identities and recover independently', async ({ page }) => {
  await select(page, 'NETWORK-014');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await completeRealMatch(page);
  await expect(page.getByRole('button', { name: /^Retry registration for/ })).toBeEnabled();
  const [first] = await persisted(page, PENDING_SUBMISSIONS_KEY);
  await page.getByRole('button', { name: 'Play Again' }).click();
  await expect(page.getByRole('status')).toHaveText('Match running.');
  await completeRealMatch(page);
  await expect(page.getByRole('button', { name: /^Retry registration for/ }).last()).toBeEnabled();
  const [preserved, second] = await persisted(page, PENDING_SUBMISSIONS_KEY);
  expect(preserved).toEqual(first); expect(second.matchId).not.toBe(first.matchId);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Battle Complete' })).toBeVisible();
  await page.evaluate(() => window.pirateBattleNetwork.recover());
  await page.getByRole('button', { name: `Retry registration for ${first.matchId}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `Retry registration for ${first.matchId}`, exact: true })).toHaveCount(0);
  expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([second]);
  await page.getByRole('button', { name: `Retry registration for ${second.matchId}`, exact: true }).click();
  await expect(page.getByText('Registration confirmed.', { exact: true })).toBeVisible();
  expect(await persisted(page, PENDING_SUBMISSIONS_KEY)).toEqual([]);
  expect((await persisted(page, MOCK_RECORDS_KEY)).map(item => item.matchId).sort()).toEqual([first.matchId, second.matchId].sort());
});
