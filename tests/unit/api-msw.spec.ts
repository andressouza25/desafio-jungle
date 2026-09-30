import { test, expect } from '@playwright/test';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import axios from 'axios';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import { configurationKey, parseMatch, type MatchRecord } from '../../src/api/contracts';
import { httpClient } from '../../src/api/client';
import { getRanking, getHistory, submitMatch } from '../../src/api/matches';
import { createQueryClient, rankingQuery, historyQuery } from '../../src/api/queryClient';
import { MockDatabase } from '../../src/mocks/database';
import { createMockApi } from '../../src/mocks/handlers';
import { SCENARIOS, NetworkScenarios } from '../../src/mocks/scenarios';
const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
const database = new MockDatabase(storage);
const scenarios = new NetworkScenarios();
let waits: number[] = [];
let releases: (() => void)[] = [];
let controlled = false;
const api = createMockApi(database, scenarios, async (milliseconds) => {
  waits.push(milliseconds);
  if (controlled && milliseconds > 0) await new Promise<void>((resolve) => releases.push(resolve));
});
const server = setupServer(...api.handlers);
const scenarioIds = ['NETWORK-001', 'NETWORK-002', 'NETWORK-003', 'NETWORK-004', 'NETWORK-005', 'NETWORK-006', 'NETWORK-007', 'NETWORK-008', 'NETWORK-009', 'NETWORK-010', 'NETWORK-011', 'NETWORK-012', 'NETWORK-013', 'NETWORK-014'] as const;
const record: MatchRecord = { matchId: 'local-match', playerId: 'local-player', playerName: 'Local Captain', date: '2026-02-01T00:00:00.000Z', score: 30, durationSeconds: 120, reason: 'timeout', config: DEFAULT_GAME_CONFIG };
const ranking = { config: DEFAULT_GAME_CONFIG, page: 1, pageSize: 5 };
test.beforeAll(() => { httpClient.defaults.baseURL = 'http://localhost/api'; server.listen({ onUnhandledFrame: 'error' }); });
test.beforeEach(() => { server.resetHandlers(); scenarios.reset(); database.reset(); values.clear(); waits = []; releases = []; controlled = false; });
test.afterEach(() => { for (const release of releases) release(); server.resetHandlers(); scenarios.reset(); database.reset(); });
test.afterAll(() => server.close());
test('contracts reject incomplete/invalid records and canonicalize every configuration field', () => {
  expect(parseMatch(record)).toEqual(record);
  expect(parseMatch({ ...record, config: {} })).toBeNull();
  expect(parseMatch({ ...record, durationSeconds: 121 })).toBeNull();
  expect(parseMatch({ ...record, score: -1 })).toBeNull();
  expect(configurationKey({ ...DEFAULT_GAME_CONFIG, player: { ...DEFAULT_GAME_CONFIG.player, health: 101 } })).not.toBe(configurationKey(DEFAULT_GAME_CONFIG));
  expect(configurationKey({ ...DEFAULT_GAME_CONFIG, spawn: { ...DEFAULT_GAME_CONFIG.spawn, distribution: { shooter: 0.5, chaser: 0.5 } } })).toBe(configurationKey(DEFAULT_GAME_CONFIG));
});
test('HTML fallback and malformed list responses reject before UI rendering; valid retry recovers', async () => {
  for (const resource of ['ranking', 'history'] as const) {
    const query = () => resource === 'ranking' ? getRanking(ranking)
      : getHistory({ playerId: 'captain-0', page: 1, pageSize: 2 });
    server.use(http.get(`*/api/${resource}`, () => HttpResponse.html('<html>Static fallback</html>')));
    await expect(query()).rejects.toThrow('Invalid match list response.');
    server.use(http.get(`*/api/${resource}`, () => HttpResponse.json({ page: 1, pageSize: 2, total: 1, totalPages: 1, items: [{}] })));
    await expect(query()).rejects.toThrow('Invalid match list record.');
    server.resetHandlers();
    expect((await query()).items.length).toBeGreaterThan(0);
  }
});
test('ranking equivalent configurations, ties, global positions and pagination', async () => {
  const first = await getRanking(ranking);
  expect(first.total).toBe(24); expect(first.totalPages).toBe(5);
  expect(first.items.map((item) => item.matchId)).toEqual(['fixture-00', 'fixture-01', 'fixture-02', 'fixture-03', 'fixture-04']);
  expect((await getRanking({ ...ranking, page: 2 })).items[0].rank).toBe(6);
  for (const section of ['player', 'projectiles', 'chaser', 'shooter'] as const) {
    const config = { ...DEFAULT_GAME_CONFIG, [section]: { ...DEFAULT_GAME_CONFIG[section], health: 999, speed: 999 } };
    // Only known fields affect the context; explicitly alter a known field for each section.
    const changed = section === 'projectiles' ? config : { ...config, [section]: { ...DEFAULT_GAME_CONFIG[section], health: 999 } };
    expect((await getRanking({ ...ranking, config: changed })).total).toBe(0);
  }
});
test('submission is durable, idempotent and consistent across ranking and history', async () => {
  await submitMatch(record); await submitMatch({ ...record, score: 99 });
  expect((await getHistory({ playerId: record.playerId, page: 1, pageSize: 1 })).items).toEqual([record]);
  expect((await getRanking(ranking)).items[0].matchId).toBe(record.matchId);
  expect(new MockDatabase(storage).records().filter((item) => item.matchId === record.matchId)).toEqual([record]);
  expect((await getHistory({ playerId: 'captain-0', page: 2, pageSize: 2 })).items).toHaveLength(2);
  await expect(submitMatch({ ...record, playerId: 'other' })).rejects.toMatchObject({ response: { status: 409 } });
  database.reset(); expect(new MockDatabase(storage).records()).toHaveLength(24);
});
for (const id of scenarioIds) {
  test(`${id} selectable, reproducible and resettable`, async () => {
    expect(SCENARIOS[id]).toBeDefined(); scenarios.select(id);
    if (['NETWORK-008', 'NETWORK-009', 'NETWORK-010', 'NETWORK-011', 'NETWORK-014'].includes(id)) {
      await expect(getRanking(ranking)).rejects.toBeDefined();
    } else if (id === 'NETWORK-012') {
      await expect(getHistory({ playerId: 'captain-0', page: 1, pageSize: 2 })).rejects.toMatchObject({ response: { status: 503 } });
      expect((await getRanking(ranking)).total).toBe(24);
    } else if (id === 'NETWORK-013') {
      await submitMatch(record); expect(waits).toContain(3000);
      scenarios.reset(); await submitMatch(record);
      expect((await getHistory({ playerId: record.playerId, page: 1, pageSize: 10 })).total).toBe(1);
    } else {
      expect((await getRanking(ranking)).total).toBe(id === 'NETWORK-002' ? 0 : 24);
      if (id === 'NETWORK-004') expect(waits).toEqual([1000]);
      if (id === 'NETWORK-005') { await getRanking(ranking); expect(waits).toEqual([100, 600]); }
      if (id === 'NETWORK-006') { await getRanking(ranking); expect(waits).toEqual([800, 100]); }
      if (id === 'NETWORK-007') expect(waits).toEqual([0, 3000]);
    }
    if (id === 'NETWORK-014') { await expect(submitMatch(record)).rejects.toMatchObject({ response: { status: 503 } }); scenarios.reset(); await submitMatch(record); }
    scenarios.reset(); expect(scenarios.id).toBe('NETWORK-001'); expect(scenarios.nextDelay()).toBe(0);
    expect((await getRanking(ranking)).total).toBeGreaterThanOrEqual(24);
  });
}
test('query cancellation prevents an older snapshot replacing a newer response', async () => {
  const client = createQueryClient(); controlled = true; scenarios.select('NETWORK-006');
  const options = rankingQuery(ranking);
  const old = client.fetchQuery({ ...options, retry: false }).catch(() => undefined);
  await expect.poll(() => releases.length).toBe(1);
  await client.cancelQueries({ queryKey: options.queryKey });
  controlled = false; await submitMatch(record); controlled = true;
  const fresh = client.fetchQuery({ ...options, retry: false });
  await expect.poll(() => releases.length).toBe(2);
  releases[1](); expect((await fresh).items[0].matchId).toBe(record.matchId);
  releases[0](); await old;
  expect(client.getQueryData(options.queryKey)?.items[0].matchId).toBe(record.matchId);
  expect(historyQuery({ playerId: 'a', page: 1, pageSize: 5 }).queryKey).not.toEqual(historyQuery({ playerId: 'b', page: 1, pageSize: 5 }).queryKey);
  client.clear();
});
test('HTTP validation and direct AbortSignal cancellation', async () => {
  await expect(httpClient.post('/matches', {})).rejects.toMatchObject({ response: { status: 400 } });
  await expect(getRanking({ ...ranking, page: 0 })).rejects.toMatchObject({ response: { status: 400 } });
  server.use(http.get('*/api/ranking', async () => { await new Promise<void>((resolve) => releases.push(resolve)); return HttpResponse.json({}); }));
  const controller = new AbortController(); const pending = getRanking(ranking, controller.signal).catch((error: unknown) => error);
  await expect.poll(() => releases.length).toBe(1); controller.abort(); expect(axios.isCancel(await pending)).toBe(true);
});



test('native Axios timeout after MSW registration recovers exactly once', async () => {
  // Native HTTP timeout is checked once against the real adapter. Scenario delay
  // scheduling itself is covered without real waits in the per-scenario tests.
  const timedApi = createMockApi(database, scenarios);
  server.use(...timedApi.handlers);
  scenarios.select('NETWORK-013');
  await expect(submitMatch(record)).rejects.toMatchObject({ code: 'ECONNABORTED' });
  scenarios.reset(); await submitMatch(record);
  expect((await getHistory({ playerId: record.playerId, page: 1, pageSize: 10 })).total).toBe(1);
  scenarios.select('NETWORK-007');
  await expect(getRanking(ranking)).rejects.toMatchObject({ code: 'ECONNABORTED' });
});

test('overlapping HTTP responses complete out of order without crossing query contexts', async () => {
  controlled = true; scenarios.select('NETWORK-006');
  const client = createQueryClient();
  const firstOptions = rankingQuery(ranking);
  const secondOptions = rankingQuery({ ...ranking, page: 2 });
  const first = client.fetchQuery(firstOptions);
  await expect.poll(() => releases.length).toBe(1);
  const second = client.fetchQuery(secondOptions);
  await expect.poll(() => releases.length).toBe(2);
  expect(waits).toEqual([800, 100]);
  releases[1](); expect((await second).items[0].rank).toBe(6);
  releases[0](); expect((await first).items[0].rank).toBe(1);
  expect(client.getQueryData(secondOptions.queryKey)?.items[0].rank).toBe(6);
  client.clear();
});
test('reset prevents an in-flight submission repopulating cleared persistence', async () => {
  controlled = true; scenarios.select('NETWORK-004');
  const pending = submitMatch(record).catch((error: unknown) => error);
  await expect.poll(() => releases.length).toBe(1);
  database.reset(); scenarios.reset(); releases[0]();
  expect(await pending).toMatchObject({ response: { status: 409 } });
  expect(new MockDatabase(storage).records()).toHaveLength(24);
});

test('ranking ties use date then match ID, and mutations invalidate both caches', async () => {
  const client = createQueryClient();
  const rankOptions = rankingQuery(ranking);
  const historyOptions = historyQuery({ playerId: record.playerId, page: 1, pageSize: 10 });
  await client.fetchQuery(rankOptions); await client.fetchQuery(historyOptions);
  const { submissionMutation } = await import('../../src/api/queryClient');
  await client.getMutationCache().build(client, submissionMutation(client)).execute({ ...record, matchId: 'tie-b' });
  expect(client.getQueryState(rankOptions.queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(historyOptions.queryKey)?.isInvalidated).toBe(true);
  await submitMatch({ ...record, matchId: 'tie-a' });
  await submitMatch({ ...record, matchId: 'tie-old', date: '2026-01-01T00:00:00Z' });
  expect((await getRanking(ranking)).items.slice(0, 3).map((item) => item.matchId)).toEqual(['tie-old', 'tie-a', 'tie-b']);
  client.clear();
});
