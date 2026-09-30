import { httpClient } from './client';
import { parseMatch, configurationKey, type RankingRequest, type RankingEntry, type HistoryRequest, type Page, type MatchRecord, type SubmitMatchRequest } from './contracts';
export async function getRanking(request: RankingRequest, signal?: AbortSignal): Promise<Page<RankingEntry>> {
  return (await httpClient.get<Page<RankingEntry>>('/ranking', { params: { ...request, config: configurationKey(request.config) }, signal })).data;
}
export async function getHistory(request: HistoryRequest, signal?: AbortSignal): Promise<Page<MatchRecord>> {
  return (await httpClient.get<Page<MatchRecord>>('/history', { params: request, signal })).data;
}
export async function submitMatch(request: SubmitMatchRequest, signal?: AbortSignal): Promise<MatchRecord> {
  const record = parseMatch((await httpClient.post<unknown>('/matches', request, { signal })).data);
  if (!record || record.matchId !== request.matchId || record.playerId !== request.playerId)
    throw new Error('Invalid match registration confirmation.');
  return record;
}
