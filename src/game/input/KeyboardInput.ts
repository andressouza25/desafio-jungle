import type { InputState } from './InputState';
import { keyboardAction, KeyboardActions } from './KeyboardActions';

// Owns physical held keys (including aliases), but contains no simulation/lifecycle rules.
export class KeyboardInput {
  private active = false;
  private destroyed = false;
  private readonly actions: KeyboardActions;

  constructor(private readonly host: HTMLElement, input: InputState) {
    this.actions = new KeyboardActions(input);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    host.addEventListener('focusout', this.onFocusOut);
  }

  setActive(active: boolean) {
    this.clear();
    this.active = !this.destroyed && active;
  }

  private inContext(event: KeyboardEvent) {
    return this.active && !document.hidden && document.hasFocus()
      && event.target instanceof Node && this.host.contains(event.target)
      && !(event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [contenteditable]'));
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const action = keyboardAction(event.code);
    if (!action || !this.inContext(event) || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    event.preventDefault();
    this.actions.press(event.code, event.repeat);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (keyboardAction(event.code) && this.inContext(event)
      && !event.altKey && !event.ctrlKey && !event.metaKey && !event.isComposing) event.preventDefault();
    this.actions.release(event.code);
  };

  private readonly onFocusOut = () => this.clear();

  private clear() { this.actions.clear(); }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.setActive(false);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.host.removeEventListener('focusout', this.onFocusOut);
  }
}
