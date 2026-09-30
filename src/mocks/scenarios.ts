export const SCENARIOS = {
  'NETWORK-001': 'Success', 'NETWORK-002': 'Empty lists', 'NETWORK-003': 'Multiple pages',
  'NETWORK-004': 'Slow responses', 'NETWORK-005': 'Variable latency', 'NETWORK-006': 'Out-of-order responses',
  'NETWORK-007': 'Timeout', 'NETWORK-008': 'Connection failure', 'NETWORK-009': 'HTTP 400', 'NETWORK-010': 'HTTP 503',
  'NETWORK-011': 'Ranking failure', 'NETWORK-012': 'History failure',
  'NETWORK-013': 'Timeout after registration', 'NETWORK-014': 'Unavailable until recovery',
} as const;
export type ScenarioId = keyof typeof SCENARIOS;
export type Wait = (milliseconds: number) => Promise<void>;
export class NetworkScenarios {
  id: ScenarioId = 'NETWORK-001';
  private sequence = 0;
  private latency: readonly number[] | undefined;
  select(id: ScenarioId, latency?: readonly number[]) {
    if (!(id in SCENARIOS) || latency?.some((value) => !Number.isFinite(value) || value < 0) || latency?.length === 0) throw new RangeError('Invalid network scenario.');
    this.id = id; this.sequence = 0; this.latency = latency;
  }
  reset() { this.select('NETWORK-001'); }
  nextDelay(): number {
    const index = this.sequence++;
    const sequence = this.latency ?? (this.id === 'NETWORK-005' ? [100, 600, 250] : this.id === 'NETWORK-006' ? [800, 100] : this.id === 'NETWORK-004' ? [1000] : [0]);
    return sequence[index % sequence.length];
  }
}
