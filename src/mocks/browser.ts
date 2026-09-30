import { queryClient, rankingQuery, historyQuery, submissionMutation } from '../api/queryClient';
import type { RankingRequest, HistoryRequest, SubmitMatchRequest } from '../api/contracts';
import { setupWorker } from 'msw/browser';
import { browserRecordStorage } from '../storage/mockRecords';
import { MockDatabase } from './database';
import { createMockApi } from './handlers';
import { SCENARIOS, type ScenarioId } from './scenarios';
const api = createMockApi(new MockDatabase(browserRecordStorage()));
const worker = setupWorker(...api.handlers);
export const mockNetwork = {
  scenarios: SCENARIOS,
  ranking: (request: RankingRequest) => queryClient.fetchQuery(rankingQuery(request)),
  history: (request: HistoryRequest) => queryClient.fetchQuery(historyQuery(request)),
  submit: (request: SubmitMatchRequest) => queryClient.getMutationCache().build(queryClient, submissionMutation(queryClient)).execute(request),
  select: (id: ScenarioId, latency?: readonly number[]) => api.scenarios.select(id, latency),
  recover: () => api.scenarios.reset(),
  reset: () => { queryClient.clear(); worker.resetHandlers(); api.scenarios.reset(); api.database.reset(); },
};
declare global { interface Window { pirateBattleNetwork: typeof mockNetwork } }
export async function startMockApi() {
  await worker.start({ serviceWorker: { url: `${import.meta.env.BASE_URL}apiServiceWorker.js` }, onUnhandledFrame: 'bypass', quiet: true });
  window.pirateBattleNetwork = mockNetwork;
}


