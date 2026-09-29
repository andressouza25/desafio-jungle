import { GameController } from './core/GameController';
import type { GameConfig } from './config/GameConfig';
import type { GameSession, GameSnapshot } from './GameSession';
import { ArenaRenderer } from './rendering/ArenaRenderer';
import type { ArenaLoadState } from './rendering/ArenaRenderer';
import { KeyboardInput } from './input/KeyboardInput';

interface InstanceOptions {
  readConfig: () => GameConfig;
  onLoad: (state: ArenaLoadState) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
}

// Browser integration owns resources; the controller owns simulation and lifecycle.
export class GameInstance implements GameSession {
  private readonly controller: GameController;
  private readonly renderer: ArenaRenderer;
  private readonly keyboard: KeyboardInput;
  private readonly unsubscribe: () => void;
  private destroyed = false;

  constructor(host: HTMLDivElement, options: InstanceOptions) {
    this.controller = new GameController({ readConfig: options.readConfig });
    this.keyboard = new KeyboardInput(host, this.controller.input);
    this.renderer = new ArenaRenderer(host, (state) => {
      if (this.destroyed) return;
      options.onLoad(state);
      if (state.kind === 'ready') this.controller.markReady();
    }, (elapsedMs) => {
      if (document.hidden) this.controller.pause();
      else this.controller.advance(elapsedMs);
      this.renderer.syncPlayer(this.controller.getPlayerState());
    });
    this.unsubscribe = this.controller.subscribe((snapshot) => {
      this.renderer.setRunning(false);
      this.keyboard.setActive(snapshot.state === 'running' && !snapshot.destroyed);
      this.renderer.syncPlayer(this.controller.getPlayerState());
      if (snapshot.state === 'running') {
        // Establish a zero delivery baseline, then let ticker.start() reset its wall-time
        // baseline. This preserves the first active interval even on an in-place restart.
        this.controller.advance(0);
        host.focus({ preventScroll: true });
        this.renderer.setRunning(true);
      }
      options.onSnapshot(snapshot);
    });
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onBlur);
  }

  private readonly onVisibility = () => { if (document.hidden) this.pause(); };
  private readonly onBlur = () => this.pause();
  private canRun() { return !this.destroyed && !document.hidden && document.hasFocus(); }

  start() { if (this.canRun()) this.controller.start(); }
  pause() { this.controller.pause(); }
  resume() { if (this.canRun()) this.controller.resume(); }
  end() { this.controller.end(); }
  restart() { if (this.canRun()) this.controller.restart(); }
  abandon() { this.controller.abandon(); }
  getSnapshot() { return this.controller.getSnapshot(); }
  subscribe(listener: (snapshot: GameSnapshot) => void) { return this.controller.subscribe(listener); }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onBlur);
    this.unsubscribe();
    this.keyboard.destroy();
    this.controller.destroy();
    this.renderer.destroy();
  }
}
