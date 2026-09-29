import { Application, Container, Sprite, TilingSprite, UPDATE_PRIORITY } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import { loadFoundationTextures } from './foundationAssets';
import { LOGICAL_ARENA } from '../config/arena';
import type { PlayerState } from '../entities/Player';

export type ArenaLoadState =
  | { kind: 'loading'; progress: number; phase: 'assets' | 'renderer' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

export class ArenaRenderer {
  private readonly abort = new AbortController();
  private application: Application | null = null;
  private world: Container | null = null;
  private player: Sprite | null = null;
  private observer: ResizeObserver | null = null;
  private densityQuery: MediaQueryList | null = null;
  private resizeFrame: number | null = null;
  private destroyed = false;

  constructor(private readonly host: HTMLDivElement, private readonly onState: (state: ArenaLoadState) => void,
    private readonly onElapsed?: (elapsedMs: number) => void) {
    void this.initialize();
  }

  private async initialize() {
    let application: Application | null = null;
    let initialized = false;
    let phase: 'assets' | 'renderer' = 'assets';

    try {
      const textures = await loadFoundationTextures((progress) => {
        if (!this.destroyed) this.onState({ kind: 'loading', phase: 'assets', progress });
      }, this.abort.signal);
      if (this.destroyed) return;

      phase = 'renderer';
      this.onState({ kind: 'loading', phase, progress: 1 });
      application = new Application();
      await application.init({
        width: Math.max(1, this.host.clientWidth),
        height: Math.max(1, this.host.clientHeight),
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        autoStart: false,
        sharedTicker: false,
        preference: 'webgl',
        backgroundColor: 0x203349,
        eventMode: 'none',
        eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
      });
      initialized = true;

      // init() is asynchronous and cannot be cancelled. Dispose a late result before attaching it.
      if (this.destroyed) {
        application.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
        return;
      }

      this.application = application;
      if (this.onElapsed) application.ticker.add(this.onTick, this, UPDATE_PRIORITY.HIGH);
      this.world = new Container();
      const water = new TilingSprite({ texture: textures.water, ...LOGICAL_ARENA });
      water.tileScale.set(2);
      water.eventMode = 'none';
      this.world.addChild(water);
      this.player = new Sprite({ texture: textures.player, anchor: 0.5 });
      this.player.label = 'player';
      this.player.eventMode = 'none';
      this.player.visible = false;
      this.world.addChild(this.player);
      application.stage.eventMode = 'none';
      application.stage.addChild(this.world);
      application.canvas.setAttribute('role', 'img');
      application.canvas.setAttribute('aria-label', 'Water arena');
      this.host.appendChild(application.canvas);

      this.observer = new ResizeObserver(() => this.scheduleResize());
      this.observer.observe(this.host);
      this.watchDensity();
      this.resize();
      this.onState({ kind: 'ready' });
    } catch {
      if (this.application) {
        this.releaseResources();
      } else if (application) {
        if (initialized) application.destroy({ removeView: true }, { children: true });
        else application.stage.destroy({ children: true });
      }
      if (!this.destroyed) {
        this.onState({
          kind: 'error',
          message: phase === 'assets'
            ? 'The game assets could not be loaded. Please try again.'
            : 'The arena could not be prepared. Please try again.',
        });
      }
    }
  }

  private readonly onDensityChange = () => {
    if (this.destroyed) return;
    this.watchDensity();
    this.resize();
  };

  private readonly onTick = (ticker: Ticker) => {
    if (!this.destroyed) this.onElapsed?.(ticker.elapsedMS);
  };

  setRunning(running: boolean) {
    if (this.destroyed || !this.application) return;
    if (running) this.application.ticker.start();
    else this.application.ticker.stop();
  }

  syncPlayer(state: Readonly<PlayerState> | null) {
    if (this.destroyed || !this.player || !this.application) return;
    this.player.visible = state !== null;
    if (state) {
      this.player.position.set(state.x, state.y);
      // Supplied ship_2 points down. Domain heading zero points up.
      this.player.rotation = state.rotation + Math.PI;
    }
    if (!this.application.ticker.started) this.application.render();
  }

  private watchDensity() {
    this.densityQuery?.removeEventListener('change', this.onDensityChange);
    this.densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    this.densityQuery.addEventListener('change', this.onDensityChange);
  }

  private scheduleResize() {
    if (this.destroyed || this.resizeFrame !== null) return;
    // Canvas density changes can alter CSS dimensions. Write outside observer delivery.
    this.resizeFrame = window.requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.resize();
    });
  }

  private resize() {
    if (this.destroyed || !this.application || !this.world) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const scale = Math.min(width / LOGICAL_ARENA.width, height / LOGICAL_ARENA.height);
    this.application.renderer.resize(width, height, window.devicePixelRatio || 1);
    this.world.scale.set(scale);
    this.world.position.set((width - LOGICAL_ARENA.width * scale) / 2, (height - LOGICAL_ARENA.height * scale) / 2);
    this.application.render();
  }

  private releaseResources() {
    this.application?.ticker.stop();
    this.application?.ticker.remove(this.onTick, this);
    this.observer?.disconnect();
    this.observer = null;
    if (this.resizeFrame !== null) window.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = null;
    this.densityQuery?.removeEventListener('change', this.onDensityChange);
    this.densityQuery = null;
    this.application?.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    this.application = null;
    this.world = null;
    this.player = null;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    this.releaseResources();
  }
}
