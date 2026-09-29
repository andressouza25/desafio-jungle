import { LOGICAL_ARENA } from '../config/arena';
import type { GameConfig } from '../config/GameConfig';

export interface PlayerState {
  x: number;
  y: number;
  rotation: number;
  health: number;
}

export function createPlayer(config: GameConfig): PlayerState {
  return { x: LOGICAL_ARENA.width / 2, y: LOGICAL_ARENA.height / 2, rotation: 0, health: config.player.health };
}
