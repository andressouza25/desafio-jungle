import { httpClient } from './client';
import { parseMatch, configurationKey, type RankingRequest, type RankingEntry, type HistoryRequest, type Page, type MatchRecord, type SubmitMatchRequest } from './contracts';

function parsePage<T>(value: unknown, parseItem: (item: unknown) => T | null): Page<T> {
  if (typeof value !== 'object' || value === null || !('items' in value) || !Array.isArray(value.items)
    || !('page' in value) || typeof value.page !== 'number' || !Number.isSafeInteger(value.page) || value.page < 1
    || !('pageSize' in value) || typeof value.pageSize !== 'number' || !Number.isSafeInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100
    || !('total' in value) || typeof value.total !== 'number' || !Number.isSafeInteger(value.total) || value.total < 0
    || !('totalPages' in value) || typeof value.totalPages !== 'number' || value.totalPages !== Math.ceil(value.total / value.pageSize))
    throw new Error('Invalid match list response.');
  const items = value.items.map((item: unknown) => {
    const record = parseItem(item);
    if (!record) throw new Error('Invalid match list record.');
    return record;
  });
  return { items, page: value.page, pageSize: value.pageSize, total: value.total, totalPages: value.totalPages };
}

export async function getRanking(request: RankingRequest, signal?: AbortSignal): Promise<Page<RankingEntry>> {
  const data: unknown = (await httpClient.get<unknown>('/ranking', { params: { ...request, config: configurationKey(request.config) }, signal })).data;
  return parsePage(data, (item) => {
    const record = parseMatch(item);
    return record && typeof item === 'object' && item !== null && 'rank' in item
      && typeof item.rank === 'number' && Number.isSafeInteger(item.rank) && item.rank > 0
      ? { ...record, rank: item.rank } : null;
  });
}
export async function getHistory(request: HistoryRequest, signal?: AbortSignal): Promise<Page<MatchRecord>> {
  return parsePage((await httpClient.get<unknown>('/history', { params: request, signal })).data, parseMatch);
}
export async function submitMatch(request: SubmitMatchRequest, signal?: AbortSignal): Promise<MatchRecord> {
  const record = parseMatch((await httpClient.post<unknown>('/matches', request, { signal })).data);
  if (!record || record.matchId !== request.matchId || record.playerId !== request.playerId)
    throw new Error('Invalid match registration confirmation.');
  return record;
}
