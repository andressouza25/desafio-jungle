import { useQuery } from '@tanstack/react-query';
import type { HistoryRequest, RankingRequest } from './contracts';
import { historyQuery, rankingQuery } from './queryClient';

export function useRanking(request: RankingRequest) {
  return useQuery(rankingQuery(request));
}

export function useMatchHistory(request: HistoryRequest) {
  return useQuery(historyQuery(request));
}
