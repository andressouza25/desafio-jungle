import type { GameConfig } from './config/GameConfig';

export type LifecycleState = 'loading' | 'ready' | 'running' | 'paused' | 'ended';
export type EndReason = 'manual' | 'abandoned';

export interface GameSnapshot {
  readonly state: LifecycleState;
  readonly elapsedSeconds: number;
  readonly config: GameConfig | null;
  readonly seed: number;
  readonly endReason: EndReason | null;
  readonly destroyed: boolean;
}

export interface GameSession {
  start(): void;
  pause(): void;
  resume(): void;
  end(): void;
  restart(): void;
  abandon(): void;
  destroy(): void;
  getSnapshot(): GameSnapshot;
  subscribe(listener: (snapshot: GameSnapshot) => void): () => void;
}
