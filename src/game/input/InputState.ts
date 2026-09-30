export type GameplayAction = 'moveForward' | 'turnLeft' | 'turnRight'
  | 'fireFront' | 'fireLeft' | 'fireRight' | 'pause';

// Shared simulation actions with independent keyboard and pointer ownership.
export class InputState {
  private readonly held = new Map<GameplayAction, Set<string>>();
  private readonly pauseRequests = new Set<string>();

  set(action: GameplayAction, pressed: boolean, owner = 'default') {
    // Pause is a command: a quick press/release between steps must not be lost.
    if (action === 'pause' && pressed) this.pauseRequests.add(owner);
    const owners = this.held.get(action) ?? new Set<string>();
    if (pressed) owners.add(owner);
    else owners.delete(owner);
    if (owners.size) this.held.set(action, owners);
    else this.held.delete(action);
  }

  isHeld(action: GameplayAction): boolean { return this.held.has(action); }
  takePauseRequest(): boolean {
    const requested = this.pauseRequests.size > 0;
    this.pauseRequests.clear();
    return requested;
  }
  clearOwners(prefix: string) {
    for (const [action, owners] of this.held) {
      for (const owner of owners) if (owner.startsWith(prefix)) this.set(action, false, owner);
    }
    for (const owner of this.pauseRequests) if (owner.startsWith(prefix)) this.pauseRequests.delete(owner);
  }
  clear() { this.held.clear(); this.pauseRequests.clear(); }
}
