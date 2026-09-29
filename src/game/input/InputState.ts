export type GameplayAction = 'moveForward' | 'turnLeft' | 'turnRight'
  | 'fireFront' | 'fireLeft' | 'fireRight' | 'pause';

// Shared actions, not physical controls. Future adapters can feed this same store.
export class InputState {
  private readonly held = new Set<GameplayAction>();
  private pauseRequested = false;

  set(action: GameplayAction, pressed: boolean) {
    // Pause is a command: a quick press/release between steps must not be lost.
    if (action === 'pause' && pressed) this.pauseRequested = true;
    if (pressed) this.held.add(action);
    else this.held.delete(action);
  }

  isHeld(action: GameplayAction): boolean { return this.held.has(action); }
  takePauseRequest(): boolean {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }
  clear() { this.held.clear(); this.pauseRequested = false; }
}
