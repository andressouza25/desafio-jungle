import { expect, test } from '@playwright/test';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QueryObserver } from '@tanstack/react-query';
import { SubmissionRecovery } from '../../src/api/SubmissionRecovery';
import { DEFAULT_GAME_CONFIG } from '../../src/game/config/GameConfig';
import type { MatchRecord } from '../../src/api/contracts';
import { httpClient } from '../../src/api/client';
import { createQueryClient, rankingQuery, historyQuery } from '../../src/api/queryClient';
import { submitMatch, getHistory, getRanking } from '../../src/api/matches';
import { MockDatabase } from '../../src/mocks/database';
import { NetworkScenarios } from '../../src/mocks/scenarios';
import { createMockApi } from '../../src/mocks/handlers';
import { loadPendingSubmissions, PENDING_SUBMISSIONS_KEY } from '../../src/storage/pendingSubmissions';
import { MOCK_RECORDS_KEY } from '../../src/storage/mockRecords';
import { parseResult } from '../../src/storage/lastResult';

const record: MatchRecord = { matchId: 'recovery-a', playerId: 'captain-0', playerName: 'Captain 1',
  date: '2026-09-30T12:00:00.000Z', score: 30, durationSeconds: 120, reason: 'timeout', config: DEFAULT_GAME_CONFIG };
const other = { ...record, matchId: 'recovery-b' };
const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
let database: MockDatabase;
let scenarios: NetworkScenarios;
const server = setupServer();
let client = createQueryClient();
test.beforeAll(() => { httpClient.defaults.baseURL = 'http://localhost/api'; server.listen({ onUnhandledFrame: 'error' }); });
test.beforeEach(() => {
  values.clear(); client = createQueryClient(); database = new MockDatabase(storage); scenarios = new NetworkScenarios();
  server.resetHandlers(...createMockApi(database, scenarios, async () => {}).handlers);
});
test.afterEach(() => client.clear());
test.afterAll(() => server.close());

test('last-result parsing preserves the exact complete record and immutable configuration', () => {
  const restored = parseResult(JSON.parse(JSON.stringify(record)));
  expect(restored).toEqual(record);
  expect(Object.isFrozen(restored)).toBe(true);
  expect(restored && 'config' in restored && Object.isFrozen(restored.config)).toBe(true);
});

test('first submission persists before sending, coalesces clicks and removes only the confirmed item', async () => {
  scenarios.select('NETWORK-004');
  let release: () => void = () => {};
  let requests = 0;
  server.resetHandlers(...createMockApi(database, scenarios, async () => {
    requests++; await new Promise<void>(resolve => { release = resolve; });
  }).handlers);
  const recovery = new SubmissionRecovery(client, storage);
  recovery.enqueue(record); recovery.enqueue({ ...record, score: 99 }); recovery.enqueue(other);
  expect(loadPendingSubmissions(storage)).toEqual([record, other]);
  const first = recovery.retry(record.matchId);
  expect(recovery.retry(record.matchId)).toBe(first);
  expect(recovery.state(record.matchId)).toBe('submitting');
  await expect.poll(() => requests).toBe(1);
  expect(loadPendingSubmissions(storage)).toEqual([record, other]);
  release(); await first;
  expect(recovery.state(record.matchId)).toBe('confirmed');
  expect(loadPendingSubmissions(storage)).toEqual([other]);
  await recovery.retry(record.matchId);
  expect(requests).toBe(1);
  expect(new MockDatabase(storage).records().filter(item => item.matchId === record.matchId)).toEqual([record]);
});

for (const scenario of ['NETWORK-008', 'NETWORK-014', 'NETWORK-013'] as const) {
  test(`${scenario}: failure or ambiguity survives a new owner, reuses the ID and recovers once`, async () => {
    if (scenario === 'NETWORK-013') server.resetHandlers(...createMockApi(database, scenarios).handlers);
    scenarios.select(scenario);
    const recovery = new SubmissionRecovery(client, storage);
    recovery.enqueue(record); recovery.enqueue(other);
    await recovery.retry(record.matchId);
    expect(recovery.state(record.matchId)).toBe('pending');
    expect(loadPendingSubmissions(storage)).toEqual([record, other]);
    expect(database.records().filter(item => item.matchId === record.matchId)).toHaveLength(scenario === 'NETWORK-013' ? 1 : 0);
    const restored = new SubmissionRecovery(client, storage);
    expect(restored.getSnapshot().map(item => item.record)).toEqual([record, other]);
    scenarios.reset(); await restored.retry(record.matchId);
    expect(restored.state(record.matchId)).toBe('confirmed');
    expect(loadPendingSubmissions(storage)).toEqual([other]);
    expect((await getHistory({ playerId: record.playerId, page: 1, pageSize: 100 })).items.filter(item => item.matchId === record.matchId)).toEqual([record]);
    expect((await getRanking({ config: record.config, page: 1, pageSize: 100 })).items.filter(item => item.matchId === record.matchId)).toHaveLength(1);
    expect(JSON.parse(values.get(MOCK_RECORDS_KEY) ?? '[]')).toEqual([record]);
  });
}

test('server boundary handles overlapping HTTP submissions, including modified duplicate data', async () => {
  const responses = await Promise.all([submitMatch(record), submitMatch(record), submitMatch({ ...record, score: 99 })]);
  expect(responses).toEqual([record, record, record]);
  expect(JSON.parse(values.get(MOCK_RECORDS_KEY) ?? '[]')).toEqual([record]);
  const recovery = new SubmissionRecovery(client, storage);
  recovery.enqueue(record); await recovery.retry(record.matchId);
  expect(loadPendingSubmissions(storage)).toEqual([]);
});

test('only confirmation refreshes observed ranking and history queries', async () => {
  const ranking = rankingQuery({ config: record.config, page: 1, pageSize: 100 });
  const history = historyQuery({ playerId: record.playerId, page: 1, pageSize: 100 });
  const rankObserver = new QueryObserver(client, ranking);
  const historyObserver = new QueryObserver(client, history);
  const stopRank = rankObserver.subscribe(() => {}); const stopHistory = historyObserver.subscribe(() => {});
  try {
    await client.fetchQuery(ranking); await client.fetchQuery(history);
    const before = client.getQueryData(history.queryKey);
    scenarios.select('NETWORK-014');
    const recovery = new SubmissionRecovery(client, storage); recovery.enqueue(record);
    await recovery.retry(record.matchId);
    expect(client.getQueryData(history.queryKey)).toBe(before);
    expect(client.getQueryState(history.queryKey)?.isInvalidated).toBe(false);
    scenarios.reset(); await recovery.retry(record.matchId);
    expect(client.getQueryData(history.queryKey)?.items.filter(item => item.matchId === record.matchId)).toEqual([record]);
    expect(client.getQueryData(ranking.queryKey)?.items.filter(item => item.matchId === record.matchId)).toHaveLength(1);
  } finally { stopRank(); stopHistory(); }
});

test('invalid confirmation stays pending and does not invalidate caches', async () => {
  server.use(http.post('*/api/matches', () => HttpResponse.json({ ...record, matchId: 'wrong-match' })));
  const recovery = new SubmissionRecovery(client, storage); recovery.enqueue(record);
  await recovery.retry(record.matchId);
  expect(recovery.state(record.matchId)).toBe('pending');
  expect(loadPendingSubmissions(storage)).toEqual([record]);
});

test('queue validates, deduplicates and tolerates unavailable storage without blocking retry', async () => {
  values.set(PENDING_SUBMISSIONS_KEY, JSON.stringify([record, record, { ...other, reason: 'abandoned' }, {}]));
  expect(loadPendingSubmissions(storage)).toEqual([record]);
  const failingStorage = { ...storage, setItem() { throw new Error('Quota'); } };
  const recovery = new SubmissionRecovery(client, failingStorage);
  recovery.enqueue(other); expect(recovery.isDurable()).toBe(false);
  expect(() => recovery.enqueue({ ...other, reason: 'abandoned' } as unknown as MatchRecord)).toThrow();
  await recovery.retry(other.matchId); expect(recovery.state(other.matchId)).toBe('confirmed');
});
