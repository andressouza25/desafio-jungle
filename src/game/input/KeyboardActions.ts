import type { GameplayAction } from './InputState';
import type { InputState } from './InputState';

const KEYBOARD_ACTIONS: Readonly<Record<string, GameplayAction | undefined>> = Object.freeze({
  KeyW: 'moveForward', ArrowUp: 'moveForward',
  KeyA: 'turnLeft', ArrowLeft: 'turnLeft', KeyD: 'turnRight', ArrowRight: 'turnRight',
  Space: 'fireFront', KeyQ: 'fireLeft', KeyE: 'fireRight', Escape: 'pause',
});

export function keyboardAction(code: string): GameplayAction | undefined {
  return Object.hasOwn(KEYBOARD_ACTIONS, code) ? KEYBOARD_ACTIONS[code] : undefined;
}

// Physical-key bookkeeping is independent of browser events and simulation rules.
export class KeyboardActions {
  private readonly keys = new Map<string, GameplayAction>();
  constructor(private readonly input: InputState) {}

  press(code: string, repeat: boolean) {
    const action = keyboardAction(code);
    // Repeats must not re-arm keys held across pause/resume or focus changes.
    if (!action || repeat) return;
    this.keys.set(code, action);
    this.input.set(action, true, `keyboard:${code}`);
  }

  release(code: string) {
    const action = this.keys.get(code);
    if (!action) return;
    this.keys.delete(code);
    this.input.set(action, false, `keyboard:${code}`);
  }

  clear() { this.keys.clear(); this.input.clearOwners('keyboard:'); }
}
