import type { GameConfig } from '../config/GameConfig';
import { snapshotGameConfig } from '../config/GameConfig';
import type { EndReason, GameSession, GameSnapshot, LifecycleState } from '../GameSession';
import { FixedStepClock } from './FixedStepClock';
import type { SimulationClock } from './FixedStepClock';
import { createSeededRandom } from './random';
import type { RandomSource } from './random';

interface ControllerOptions {
  readConfig: () => GameConfig;
  clock?: SimulationClock;
  seed?: number;
  createRandom?: (seed: number) => RandomSource;
}

export class GameController implements GameSession {
  private state: LifecycleState = 'loading';
  private config: GameConfig | null = null;
  private endReason: EndReason | null = null;
  private destroyed = false;
  private randomSource: RandomSource | null = null;
  private readonly clock: SimulationClock;
  private readonly seed: number;
  private readonly listeners = new Set<(snapshot: GameSnapshot) => void>();

  constructor(private readonly options: ControllerOptions) {
    this.clock = options.clock ?? new FixedStepClock();
    this.seed = options.seed ?? 1;
    if (!Number.isInteger(this.seed)) throw new RangeError('A match seed must be an integer.');
  }

  get random(): RandomSource | null { return this.randomSource; }

  getSnapshot(): GameSnapshot {
    return Object.freeze({ state: this.state, elapsedSeconds: this.clock.elapsedSeconds,
      config: this.config, seed: this.seed, endReason: this.endReason, destroyed: this.destroyed });
  }

  subscribe(listener: (snapshot: GameSnapshot) => void): () => void {
    if (this.destroyed) return () => {};
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => { this.listeners.delete(listener); };
  }

  private publish() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  markReady() {
    if (this.destroyed || this.state !== 'loading') return;
    this.state = 'ready';
    this.publish();
  }

  start() {
    if (this.destroyed || this.state !== 'ready') return;
    this.beginMatch();
  }

  private beginMatch() {
    const config = snapshotGameConfig(this.options.readConfig());
    const random = (this.options.createRandom ?? createSeededRandom)(this.seed);
    this.clock.reset();
    this.config = config;
    this.randomSource = random;
    this.endReason = null;
    this.state = 'running';
    this.publish();
  }

  advance(elapsedMs: number) {
    if (!this.destroyed && this.state === 'running') this.clock.advance(elapsedMs);
    // Per-step time stays here. UI receives lifecycle transitions, never this loop.
  }

  pause() {
    if (this.destroyed || this.state !== 'running') return;
    this.clock.rebase();
    this.state = 'paused';
    this.publish();
  }

  resume() {
    if (this.destroyed || this.state !== 'paused') return;
    this.clock.rebase();
    this.state = 'running';
    this.publish();
  }

  end(reason: EndReason = 'manual') {
    if (this.destroyed || (this.state !== 'running' && this.state !== 'paused')) return;
    this.clock.rebase();
    this.state = 'ended';
    this.endReason = reason;
    this.publish();
  }

  restart() {
    if (this.destroyed || this.state === 'loading') return;
    this.beginMatch();
  }

  abandon() { this.end('abandoned'); }

  destroy() {
    if (this.destroyed) return;
    if (this.state === 'running' || this.state === 'paused') {
      this.state = 'ended';
      this.endReason = 'abandoned';
    }
    this.destroyed = true;
    this.clock.rebase();
    this.randomSource = null;
    this.publish();
    this.listeners.clear();
  }
}
