import type { GameConfig } from './config/GameConfig';

export type LifecycleState = 'loading' | 'ready' | 'running' | 'paused' | 'ended';
export type EndReason = 'manual' | 'abandoned' | 'timeout' | 'player-death';

export interface MatchResult {
  readonly score: number;
  readonly durationSeconds: number;
  readonly reason: 'timeout' | 'player-death';
}

export interface GameSnapshot {
  readonly score: number;
  readonly playerHealth: number;
  readonly playerMaxHealth: number;
  readonly remainingSeconds: number;
  readonly result: MatchResult | null;
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
