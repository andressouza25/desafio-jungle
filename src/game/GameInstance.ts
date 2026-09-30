import { GameAudio } from './feedback/GameAudio';
import { GameController } from './core/GameController';
import type { GameConfig } from './config/GameConfig';
import type { GameSession, GameSnapshot } from './GameSession';
import { ArenaRenderer } from './rendering/ArenaRenderer';
import type { ArenaLoadState } from './rendering/ArenaRenderer';
import { KeyboardInput } from './input/KeyboardInput';
import { TouchInput } from './input/TouchInput';

interface InstanceOptions {
  readConfig: () => GameConfig;
  onLoad: (state: ArenaLoadState) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
}

// Browser integration owns resources; the controller owns simulation and lifecycle.
export class GameInstance implements GameSession {
  private readonly audio = new GameAudio();
  private readonly unsubscribeFeedback: () => void;
  private readonly controller: GameController;
  private readonly renderer: ArenaRenderer;
  private readonly keyboard: KeyboardInput;
  private readonly touch: TouchInput;
  private readonly unsubscribe: () => void;
  private destroyed = false;
  private previousState: GameSnapshot['state'] | null = null;
  private previousConfig: GameConfig | null = null;

  constructor(private readonly host: HTMLDivElement, options: InstanceOptions) {
    // Narrow E2E input: Vite removes this development-only branch from production.
    const testSeed: unknown = import.meta.env.DEV ? Reflect.get(window, '__pirateBattleTestSeed') : undefined;
    const seed = typeof testSeed === 'number' && Number.isInteger(testSeed) && testSeed >= 0 && testSeed <= 0xffffffff
      ? testSeed : undefined;
    this.controller = new GameController({ readConfig: options.readConfig, seed });
    this.keyboard = new KeyboardInput(host, this.controller.input);
    this.touch = new TouchInput(host.closest('.game-screen') ?? host, this.controller.input,
      () => this.controller.advance(0));
    this.renderer = new ArenaRenderer(host, (state) => {
      if (this.destroyed) return;
      options.onLoad(state);
      if (state.kind === 'ready') this.controller.markReady();
    }, (elapsedMs) => {
      if (document.hidden) this.controller.pause();
      else this.controller.advance(elapsedMs);
      this.renderer.syncState(this.controller.getPlayerState(), this.controller.getProjectileStates(), this.controller.getEnemyStates(), this.controller.getSnapshot().config);
      const player = this.controller.getPlayerState();
      const snapshot = this.controller.getSnapshot();
      const config = snapshot.config;
      const ships = config ? this.controller.getEnemyStates().map((enemy) => ({ id: enemy.id, x: enemy.x, y: enemy.y, ratio: enemy.health / config[enemy.kind].health })) : [];
      if (player && snapshot.config) ships.push({ id: -1, x: player.x, y: player.y, ratio: player.health / snapshot.config.player.health });
      this.renderer.syncFeedback(snapshot.elapsedSeconds, ships);
    });
    this.unsubscribeFeedback = this.controller.subscribeFeedback((event) => {
      this.renderer.reactFeedback(event); this.audio.react(event);
    });
    this.unsubscribe = this.controller.subscribe((snapshot) => {
      this.audio.sync(snapshot);
      if (snapshot.state === this.previousState && snapshot.config === this.previousConfig) { options.onSnapshot(snapshot); return; }
      if (snapshot.config !== this.previousConfig || snapshot.state === 'ended') this.renderer.clearFeedback();
      this.previousState = snapshot.state;
      this.previousConfig = snapshot.config;
      this.renderer.setRunning(false);

      this.keyboard.setActive(snapshot.state === 'running' && !snapshot.destroyed);
      this.touch.setActive(snapshot.state === 'running' && !snapshot.destroyed);
      this.renderer.syncState(this.controller.getPlayerState(), this.controller.getProjectileStates(), this.controller.getEnemyStates(), this.controller.getSnapshot().config);
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
    host.addEventListener('focusout', this.onFocusOut);
    window.addEventListener('pointerdown', this.onGesture, true);
    window.addEventListener('keydown', this.onGesture, true);
  }

  private readonly onGesture = (event: Event) => {
    if (!event.isTrusted) return;
    this.audio.unlock();
    if (event.target instanceof Element && event.target.closest('button')
      && (event.type === 'pointerdown' || (event instanceof KeyboardEvent && !event.repeat && ['Enter', 'Space'].includes(event.code)))) this.audio.play('ui_click');
  };
  private readonly onFocusOut = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node) || !(this.host.closest('.game-screen') ?? this.host).contains(event.relatedTarget)) this.pause();
  };
  private readonly onVisibility = () => { if (document.hidden) this.pause(); };
  private readonly onBlur = () => this.pause();
  private canRun() { return !this.destroyed && !document.hidden && document.hasFocus(); }

  start() { if (this.canRun()) this.controller.start(); }
  pause() {
    if (this.controller.getSnapshot().state !== 'running') return;
    this.controller.input.set('pause', true);
    // Consume the same latched command as Escape, even between ticker deliveries.
    this.controller.advance(0);
  }
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
    this.host.removeEventListener('focusout', this.onFocusOut);
    window.removeEventListener('pointerdown', this.onGesture, true);
    window.removeEventListener('keydown', this.onGesture, true);
    this.unsubscribeFeedback();
    this.audio.destroy();
    this.unsubscribe();
    this.keyboard.destroy();
    this.touch.destroy();
    this.controller.destroy();
    this.renderer.destroy();
  }
}
