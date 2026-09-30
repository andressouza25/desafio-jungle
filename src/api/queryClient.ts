import { QueryClient, queryOptions, mutationOptions } from '@tanstack/react-query';
import axios from 'axios';
import { configurationKey, type RankingRequest, type HistoryRequest, type SubmitMatchRequest } from './contracts';
import { getRanking, getHistory, submitMatch } from './matches';
export function createQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { staleTime: 0, gcTime: 300000, refetchOnMount: 'always', refetchOnWindowFocus: true,
      retry: (count, error) => count < 2 && !axios.isCancel(error) && (!axios.isAxiosError(error) || !error.response || error.response.status >= 500),
      retryDelay: (attempt) => Math.min(250 * 2 ** attempt, 2000) },
    mutations: { retry: false },
  } });
}
export const queryClient = createQueryClient();
export const remoteKeys = { ranking: ['ranking'] as const, history: ['history'] as const };
export function rankingQuery(request: RankingRequest) {
  return queryOptions({ queryKey: [...remoteKeys.ranking, configurationKey(request.config), request.page, request.pageSize],
    queryFn: ({ signal }) => getRanking(request, signal) });
}
export function historyQuery(request: HistoryRequest) {
  return queryOptions({ queryKey: [...remoteKeys.history, request.playerId, request.page, request.pageSize],
    queryFn: ({ signal }) => getHistory(request, signal) });
}
export function submissionMutation(client: QueryClient) {
  return mutationOptions({ mutationKey: ['submit-match'], mutationFn: (record: SubmitMatchRequest) => submitMatch(record),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: remoteKeys.ranking }), client.invalidateQueries({ queryKey: remoteKeys.history })]);
    } });
}
