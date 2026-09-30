import { http, HttpResponse, delay } from 'msw';
import { HTTP_TIMEOUT_MS } from '../api/client';
import { configurationKey, isGameConfig, parseMatch } from '../api/contracts';
import { MockDatabase, compareRanking, equivalent } from './database';
import { NetworkScenarios, type Wait } from './scenarios';
export function createMockApi(database: MockDatabase, scenarios = new NetworkScenarios(), wait: Wait = delay) {
  async function failure(resource: 'ranking' | 'history' | 'submission', id: string, milliseconds: number) {
    await wait(milliseconds);
    if (id === 'NETWORK-007' || (id === 'NETWORK-013' && resource === 'submission')) await wait(HTTP_TIMEOUT_MS + 1000);
    if (id === 'NETWORK-008') return HttpResponse.error();
    if (id === 'NETWORK-009') return HttpResponse.json({ message: 'Bad request scenario.' }, { status: 400 });
    if (id === 'NETWORK-010' || id === 'NETWORK-014' || (id === 'NETWORK-011' && resource === 'ranking') || (id === 'NETWORK-012' && resource === 'history'))
      return HttpResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
  function pagination(url: URL) {
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    return Number.isSafeInteger(page) && page > 0 && Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? { page, pageSize } : null;
  }
  const handlers = [
    http.get('*/api/ranking', async ({ request }) => {
      const url = new URL(request.url); const paging = pagination(url);
      let context: unknown;
      try { context = JSON.parse(url.searchParams.get('config') ?? 'null'); } catch { /* Invalid wire input. */ }
      if (!paging || !isGameConfig(context)) return HttpResponse.json({ message: 'Invalid ranking request.' }, { status: 400 });
      let key: string;
      try { key = configurationKey(context); } catch { return HttpResponse.json({ message: 'Invalid configuration.' }, { status: 400 }); }
      const id = scenarios.id;
      const records = database.records(id === 'NETWORK-002').filter((record) => equivalent(record, key)).sort(compareRanking)
        .map((record, index) => ({ ...record, rank: index + 1 }));
      const error = await failure('ranking', id, scenarios.nextDelay()); if (error) return error;
      return HttpResponse.json({ ...paging, items: records.slice((paging.page - 1) * paging.pageSize, paging.page * paging.pageSize), total: records.length, totalPages: Math.ceil(records.length / paging.pageSize) });
    }),
    http.get('*/api/history', async ({ request }) => {
      const url = new URL(request.url); const paging = pagination(url); const playerId = url.searchParams.get('playerId');
      if (!paging || !playerId) return HttpResponse.json({ message: 'Invalid history request.' }, { status: 400 });
      const id = scenarios.id;
      const records = database.records(id === 'NETWORK-002').filter((record) => record.playerId === playerId)
        .sort((a, b) => b.date.localeCompare(a.date) || a.matchId.localeCompare(b.matchId));
      const error = await failure('history', id, scenarios.nextDelay()); if (error) return error;
      return HttpResponse.json({ ...paging, items: records.slice((paging.page - 1) * paging.pageSize, paging.page * paging.pageSize), total: records.length, totalPages: Math.ceil(records.length / paging.pageSize) });
    }),
    http.post('*/api/matches', async ({ request }) => {
      let value: unknown;
      try { value = await request.json(); } catch { return HttpResponse.json({ message: 'Invalid JSON.' }, { status: 400 }); }
      const record = parseMatch(value);
      if (!record) return HttpResponse.json({ message: 'Invalid completed match.' }, { status: 400 });
      const generation = database.generation;
      const id = scenarios.id; const milliseconds = scenarios.nextDelay();
      if (id !== 'NETWORK-013') { const error = await failure('submission', id, milliseconds); if (error) return error; }
      if (generation !== database.generation) return HttpResponse.json({ message: 'Mock state was reset.' }, { status: 409 });
      try {
        const result = database.register(record);
        if (id === 'NETWORK-013') await failure('submission', id, milliseconds);
        return HttpResponse.json(result.record, { status: result.created ? 201 : 200 });
      } catch { return HttpResponse.json({ message: 'Unable to register match.' }, { status: 409 }); }
    }),
  ];
  return { handlers, scenarios, database };
}

