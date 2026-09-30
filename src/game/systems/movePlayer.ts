import type { GameConfig } from '../config/GameConfig';
import type { PlayerState } from '../entities/Player';
import type { InputState } from '../input/InputState';
import { ARENA_LAYOUT, PLAYER_COLLIDER_HALF_SIZE } from '../config/arena';
import { resolveArenaMovement } from './collision';

export function movePlayer(player: PlayerState, input: InputState, config: GameConfig, deltaSeconds: number) {
  const direction = Number(input.isHeld('turnRight')) - Number(input.isHeld('turnLeft'));
  // Heading zero faces up; positive rotation turns clockwise. Opposing turns cancel.
  const fullTurn = Math.PI * 2;
  const rotation = ((player.rotation + direction * config.player.rotationSpeed * deltaSeconds) % fullTurn + fullTurn) % fullTurn;
  let proposedX = player.x;
  let proposedY = player.y;
  if (input.isHeld('moveForward')) {
    const distance = config.player.movementSpeed * deltaSeconds;
    proposedX += Math.sin(rotation) * distance;
    proposedY -= Math.cos(rotation) * distance;
  }
  const resolved = resolveArenaMovement(player, { x: proposedX, y: proposedY }, PLAYER_COLLIDER_HALF_SIZE, ARENA_LAYOUT);
  player.x = resolved.x;
  player.y = resolved.y;
  player.rotation = rotation;
}
