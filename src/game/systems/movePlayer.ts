import type { GameConfig } from '../config/GameConfig';
import type { PlayerState } from '../entities/Player';
import type { InputState } from '../input/InputState';

export function movePlayer(player: PlayerState, input: InputState, config: GameConfig, deltaSeconds: number) {
  const direction = Number(input.isHeld('turnRight')) - Number(input.isHeld('turnLeft'));
  // Heading zero faces up; positive rotation turns clockwise. Opposing turns cancel.
  const fullTurn = Math.PI * 2;
  player.rotation = ((player.rotation + direction * config.player.rotationSpeed * deltaSeconds) % fullTurn + fullTurn) % fullTurn;
  if (input.isHeld('moveForward')) {
    const distance = config.player.movementSpeed * deltaSeconds;
    player.x += Math.sin(player.rotation) * distance;
    player.y -= Math.cos(player.rotation) * distance;
  }
}
