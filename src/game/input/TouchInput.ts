import type { GameplayAction, InputState } from './InputState';

function gameplayAction(value: string | undefined): value is GameplayAction {
  return ['moveForward', 'turnLeft', 'turnRight', 'fireFront', 'fireLeft', 'fireRight', 'pause'].some((action) => action === value);
}
// Pointer ownership feeds shared actions; no gameplay rules or world coordinates.
export class TouchInput {
  private active = false;
  private readonly pointers = new Map<number, { action: GameplayAction; button: HTMLElement }>();
  constructor(private readonly surface: HTMLElement, private readonly input: InputState,
    private readonly onPauseRequested: () => void) {
    surface.addEventListener('pointerdown', this.down);
    surface.addEventListener('lostpointercapture', this.up);
    surface.addEventListener('click', this.activatePause);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
  }
  setActive(active: boolean) { this.clear(); this.active = active; }
  private readonly activatePause = (event: MouseEvent) => {
    // Keyboard/assistive activation emits click with detail 0; pointerdown already pauses.
    if (!this.active || event.detail !== 0 || !(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>('[data-game-action="pause"]');
    if (!button || !this.surface.contains(button)) return;
    this.input.set('pause', true, 'touch-keyboard');
    this.onPauseRequested();
    this.input.set('pause', false, 'touch-keyboard');
  };
  private readonly down = (event: PointerEvent) => {
    if (!this.active || event.button !== 0 || !(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>('[data-game-action]');
    const action = button?.dataset.gameAction;
    if (!button || !this.surface.contains(button) || !gameplayAction(action)) return;
    event.preventDefault();
    this.release(event.pointerId);
    this.pointers.set(event.pointerId, { action, button });
    this.input.set(action, true, `pointer:${event.pointerId}`);
    button.dataset.pressed = 'true';
    if (event.isTrusted) button.setPointerCapture(event.pointerId);
    if (action === 'pause') this.onPauseRequested();
  };
  private readonly up = (event: PointerEvent) => this.release(event.pointerId);
  private release(id: number) {
    const held = this.pointers.get(id);
    if (!held) return;
    this.pointers.delete(id);
    this.input.set(held.action, false, `pointer:${id}`);
    if (![...this.pointers.values()].some((pointer) => pointer.button === held.button)) delete held.button.dataset.pressed;
    if (held.button.hasPointerCapture(id)) held.button.releasePointerCapture(id);
  }
  clear() { for (const id of this.pointers.keys()) this.release(id); }
  destroy() {
    this.setActive(false);
    this.surface.removeEventListener('pointerdown', this.down);
    this.surface.removeEventListener('lostpointercapture', this.up);
    this.surface.removeEventListener('click', this.activatePause);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('pointercancel', this.up);
  }
}
