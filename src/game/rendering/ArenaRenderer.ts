import { VisualFeedback } from '../feedback/VisualFeedback';
import { loadEffectTextures } from '../feedback/effectAssets';
import type { FeedbackEvent } from '../core/FeedbackEvent';
import type { GameConfig } from '../config/GameConfig';
import { HealthIndicator, loadHealthTextures } from './HealthIndicator';
import type { HealthTextures } from './HealthIndicator';
import type { EnemyKind, EnemyState } from '../entities/Enemy';
import { Application, Container, Rectangle, Sprite, Texture, TilingSprite, UPDATE_PRIORITY } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import { loadFoundationTextures } from './foundationAssets';
import { ARENA_LAYOUT, LOGICAL_ARENA } from '../config/arena';
import type { PlayerState } from '../entities/Player';
import type { ProjectileState } from '../entities/Projectile';

export type ArenaLoadState =
  | { kind: 'loading'; progress: number; phase: 'assets' | 'renderer' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

export class ArenaRenderer {
  private feedback: VisualFeedback | null = null;
  private readonly abort = new AbortController();
  private application: Application | null = null;
  private world: Container | null = null;
  private player: Sprite | null = null;
  private islandTexture: Texture | null = null;
  private projectileTexture: Texture | null = null;
  private enemyTextures: Record<EnemyKind, Texture> | null = null;
  private readonly enemies = new Map<number, Sprite>();
  private readonly projectiles = new Map<number, Sprite>();
  private healthTextures: HealthTextures | null = null;
  private readonly healthLayer = new Container();
  private readonly health = new Map<number, HealthIndicator>();
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

      this.healthTextures = await loadHealthTextures();
      if (this.destroyed) return;
      const effectTextures = await loadEffectTextures();
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
      this.projectileTexture = textures.projectile;
      this.enemyTextures = { chaser: textures.chaser, shooter: textures.shooter };
      if (this.onElapsed) application.ticker.add(this.onTick, this, UPDATE_PRIORITY.HIGH);
      this.world = new Container();
      this.feedback = new VisualFeedback(effectTextures);
      const water = new TilingSprite({ texture: textures.water, ...LOGICAL_ARENA });
      water.tileScale.set(2);
      water.eventMode = 'none';
      this.world.addChild(water);
      // Inspected 1× atlas: 64px tiles, grass/sand island at column 5, row 0 (4×4).
      // This is artwork selection only; collision geometry comes from ARENA_LAYOUT.
      this.islandTexture = new Texture({ source: textures.environment.source, frame: new Rectangle(320, 0, 256, 256) });
      for (const obstacle of ARENA_LAYOUT.islands) {
        const island = new Sprite({ texture: this.islandTexture });
        island.label = 'island';
        island.eventMode = 'none';
        island.position.set(obstacle.x, obstacle.y);
        island.width = obstacle.width;
        island.height = obstacle.height;
        this.world.addChild(island);
      }
      this.player = new Sprite({ texture: textures.player, anchor: 0.5 });
      this.healthLayer.label = 'health-layer';
      this.world.addChild(this.healthLayer);
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

  syncState(state: Readonly<PlayerState> | null, projectiles: readonly Readonly<ProjectileState>[], enemies: readonly Readonly<EnemyState>[] = [], config: GameConfig | null = null) {
    if (this.destroyed || !this.player || !this.application || !this.world || !this.projectileTexture) return;
    this.player.visible = state !== null;
    if (state) {
      this.player.position.set(state.x, state.y);
      // Supplied ship_2 points down. Domain heading zero points up.
      this.player.rotation = state.rotation + Math.PI;
    }
    const healthIds = new Set<number>();
    const syncHealth = (id: number, x: number, y: number, value: number, max: number) => {
      if (!this.healthTextures) return;
      healthIds.add(id);
      let indicator = this.health.get(id);
      if (!indicator) {
        indicator = new HealthIndicator(this.healthTextures, id !== -1);
        indicator.label = id === -1 ? 'health:player' : `health:enemy:${id}`;
        this.health.set(id, indicator);
        this.healthLayer.addChild(indicator);
      }
      indicator.sync(x, y, value, max);
    };
    if (state && config) syncHealth(-1, state.x, state.y, state.health, config.player.health);
    const enemyIds = new Set<number>();
    for (const enemy of enemies) {
      if (enemy.destroyed || !this.enemyTextures) continue;
      enemyIds.add(enemy.id);
      if (config) syncHealth(enemy.id, enemy.x, enemy.y, enemy.health, config[enemy.kind].health);
      let sprite = this.enemies.get(enemy.id);
      if (!sprite) {
        sprite = new Sprite({ texture: this.enemyTextures[enemy.kind], anchor: 0.5 });
        sprite.label = `enemy:${enemy.id}:${enemy.kind}`;
        sprite.eventMode = 'none';
        this.enemies.set(enemy.id, sprite);
        this.world.addChild(sprite);
      }
      sprite.position.set(enemy.x, enemy.y);
      sprite.rotation = enemy.rotation + Math.PI;
    }
    for (const [id, sprite] of this.enemies) {
      if (enemyIds.has(id)) continue;
      this.world.removeChild(sprite);
      sprite.destroy({ texture: false, textureSource: false });
      this.enemies.delete(id);
    }
    for (const [id, indicator] of this.health) {
      if (healthIds.has(id)) continue;
      indicator.destroy();
      this.health.delete(id);
    }
    const activeIds = new Set<number>();
    for (const projectile of projectiles) {
      if (projectile.resolution !== null) continue;
      activeIds.add(projectile.id);
      let sprite = this.projectiles.get(projectile.id);
      if (!sprite) {
        sprite = new Sprite({ texture: this.projectileTexture, anchor: 0.5 });
        sprite.label = `projectile:${projectile.id}:${projectile.weapon}`;
        sprite.eventMode = 'none';
        this.projectiles.set(projectile.id, sprite);
        this.world.addChild(sprite);
      }
      sprite.position.set(projectile.x, projectile.y);
    }
    for (const [id, sprite] of this.projectiles) {
      if (activeIds.has(id)) continue;
      this.world.removeChild(sprite);
      sprite.destroy({ texture: false, textureSource: false });
      this.projectiles.delete(id);
    }
    // Keep indicators above ships and cannonballs without inheriting ship rotation.
    this.world.addChild(this.healthLayer);
    if (!this.application.ticker.started) this.application.render();
  }

  reactFeedback(event: FeedbackEvent) { this.feedback?.react(event); }
  clearFeedback() { this.feedback?.clear(); }
  syncFeedback(time: number, ships: readonly { id: number; x: number; y: number; ratio: number }[]) {
    this.feedback?.sync(time, ships);
    if (this.world && this.feedback) this.world.addChild(this.feedback);
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
    // Floating-point multiplication can put an exactly fitted edge infinitesimally below zero.
    this.world.position.set(Math.max(0, (width - LOGICAL_ARENA.width * scale) / 2),
      Math.max(0, (height - LOGICAL_ARENA.height * scale) / 2));
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
    for (const indicator of this.health.values()) indicator.destroy();
    this.health.clear();
    this.healthTextures = null;
    this.feedback?.destroy();
    this.feedback = null;
    this.healthLayer.destroy({ children: true });
    this.application?.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    this.projectiles.clear();
    this.enemies.clear();
    this.enemyTextures = null;
    this.projectileTexture = null;
    this.islandTexture?.destroy(false); // Release the frame wrapper, not the shared atlas source.
    this.islandTexture = null;
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
