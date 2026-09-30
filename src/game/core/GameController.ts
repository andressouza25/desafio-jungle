import type { EnemyState } from '../entities/Enemy';
import { updateEnemies } from '../systems/updateEnemies';
import { spawnEnemies } from '../systems/spawnEnemies';
import type { GameConfig } from '../config/GameConfig';
import { snapshotGameConfig } from '../config/GameConfig';
import type { EndReason, GameSession, GameSnapshot, LifecycleState, MatchResult } from '../GameSession';
import { FixedStepClock } from './FixedStepClock';
import type { SimulationClock } from './FixedStepClock';
import { createSeededRandom } from './random';
import type { RandomSource } from './random';
import { InputState } from '../input/InputState';
import { createPlayer } from '../entities/Player';
import type { PlayerState } from '../entities/Player';
import { movePlayer } from '../systems/movePlayer';
import { createWeaponState, fireWeapons } from '../systems/fireWeapons';
import { updateProjectiles } from '../systems/updateProjectiles';
import type { ProjectileState } from '../entities/Projectile';
import { resolveProjectile } from '../entities/Projectile';
import { ARENA_LAYOUT } from '../config/arena';

interface ControllerOptions {
  readConfig: () => GameConfig;
  clock?: SimulationClock;
  seed?: number;
  createRandom?: (seed: number) => RandomSource;
}

export class GameController implements GameSession {
  readonly input = new InputState();
  private player: PlayerState | null = null;
  private projectiles: ProjectileState[] = [];
  private enemies: EnemyState[] = [];
  private spawn = { nextAtSeconds: 0, nextEnemyId: 1 };
  private weapons = createWeaponState();
  private state: LifecycleState = 'loading';
  private config: GameConfig | null = null;
  private endReason: EndReason | null = null;
  private destroyed = false;
  private score = 0;
  private result: MatchResult | null = null;
  private randomSource: RandomSource | null = null;
  private readonly clock: SimulationClock;
  private readonly seed: number;
  private readonly listeners = new Set<(snapshot: GameSnapshot) => void>();

  constructor(private readonly options: ControllerOptions) {
    this.clock = options.clock ?? new FixedStepClock();
    this.seed = options.seed ?? 1;
    if (!Number.isInteger(this.seed)) throw new RangeError('A match seed must be an integer.');
  }

  get random(): RandomSource | null { return this.randomSource; }
  getPlayerState(): Readonly<PlayerState> | null { return this.player ? Object.freeze({ ...this.player }) : null; }
  getProjectileStates(): readonly Readonly<ProjectileState>[] {
    return Object.freeze(this.projectiles.map((projectile) => Object.freeze({ ...projectile })));
  }

  getEnemyStates(): readonly Readonly<EnemyState>[] {
    return Object.freeze(this.enemies.map((enemy) => Object.freeze({ ...enemy })));
  }
  private clearEnemies() {
    for (const enemy of this.enemies) enemy.destroyed = true;
    this.enemies = [];
  }
  private clearProjectiles() {
    for (const projectile of this.projectiles) resolveProjectile(projectile, 'cleared');
    this.projectiles = [];
  }

  getSnapshot(): GameSnapshot {
    return Object.freeze({ state: this.state, elapsedSeconds: this.matchSeconds,
      score: this.score, playerHealth: this.player?.health ?? 0, playerMaxHealth: this.config?.player.health ?? 0,
      remainingSeconds: this.config ? Math.ceil(Math.max(0, this.config.session.durationSeconds - this.matchSeconds - 1e-9)) : 0,
      result: this.result,
      config: this.config, seed: this.seed, endReason: this.endReason, destroyed: this.destroyed });
  }

  private get matchSeconds() {
    return Math.min(this.clock.elapsedSeconds, this.config?.session.durationSeconds ?? 0);
  }

  subscribe(listener: (snapshot: GameSnapshot) => void): () => void {
    if (this.destroyed) return () => {};
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => { this.listeners.delete(listener); };
  }

  private publish() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  markReady() {
    if (this.destroyed || this.state !== 'loading') return;
    this.state = 'ready';
    this.publish();
  }

  start() {
    if (this.destroyed || this.state !== 'ready') return;
    this.beginMatch();
  }

  private beginMatch() {
    const config = snapshotGameConfig(this.options.readConfig());
    const random = (this.options.createRandom ?? createSeededRandom)(this.seed);
    this.clock.reset();
    this.input.clear();
    this.clearProjectiles();
    this.clearEnemies();
    this.weapons = createWeaponState();
    this.player = createPlayer(config);
    this.spawn = { nextAtSeconds: config.spawn.intervalSeconds, nextEnemyId: 1 };
    this.config = config;
    this.randomSource = random;
    this.endReason = null;
    this.score = 0;
    this.result = null;
    this.state = 'running';
    this.publish();
  }

  advance(elapsedMs: number) {
    if (this.destroyed || this.state !== 'running') return;
    if (this.input.takePauseRequest()) { this.pause(); return; }
    const before = this.getSnapshot();
    this.clock.advance(elapsedMs, (deltaSeconds) => {
      if (this.state !== 'running') return false;
      if (this.player && this.config) {
        movePlayer(this.player, this.input, this.config, deltaSeconds);
        this.projectiles = updateProjectiles(this.projectiles, deltaSeconds, ARENA_LAYOUT, this.enemies, this.player);
        const enemyShots = updateEnemies(this.enemies, this.player, this.config, deltaSeconds, this.clock.elapsedSeconds, this.weapons, ARENA_LAYOUT);
        this.score += this.enemies.filter((enemy) => enemy.destroyed && enemy.destructionSource === 'player-attack').length;
        this.enemies = this.enemies.filter((enemy) => !enemy.destroyed);
        // Death wins when both conditions resolve in the same fixed step.
        if (this.player.health === 0) { this.end('player-death'); return false; }
        if (this.clock.elapsedSeconds + 1e-9 >= this.config.session.durationSeconds) { this.end('timeout'); return false; }
        if (this.randomSource && this.player.health > 0) this.enemies.push(...spawnEnemies(this.spawn, this.clock.elapsedSeconds, this.player, this.config, this.randomSource, ARENA_LAYOUT));
        this.projectiles.push(...enemyShots);
        // Fire at this step's end from the resolved player transform. New shots move next step.
        if (this.player.health > 0) this.projectiles.push(...fireWeapons(this.player, this.input, this.config, this.weapons, this.clock.elapsedSeconds));
      }
    });
    const after = this.getSnapshot();
    if (after.state === 'running' && (before.playerHealth !== after.playerHealth || before.score !== after.score
      || before.remainingSeconds !== after.remainingSeconds)) this.publish();
  }

  pause() {
    if (this.destroyed || this.state !== 'running') return;
    this.clock.rebase();
    this.input.clear();
    this.state = 'paused';
    this.publish();
  }

  resume() {
    if (this.destroyed || this.state !== 'paused') return;
    this.clock.rebase();
    this.input.clear();
    this.state = 'running';
    this.publish();
  }

  end(reason: EndReason = 'manual') {
    if (this.destroyed || (this.state !== 'running' && this.state !== 'paused')) return;
    this.clock.rebase();
    this.input.clear();
    this.state = 'ended';
    this.endReason = reason;
    if (reason === 'timeout' || reason === 'player-death') {
      this.result = Object.freeze({ score: this.score, durationSeconds: this.matchSeconds, reason });
    }
    this.clearProjectiles();
    this.clearEnemies();
    this.publish();
  }

  restart() {
    if (this.destroyed || this.state === 'loading') return;
    this.beginMatch();
  }

  abandon() { this.end('abandoned'); }

  destroy() {
    if (this.destroyed) return;
    if (this.state === 'running' || this.state === 'paused') {
      this.state = 'ended';
      this.endReason = 'abandoned';
    }
    this.destroyed = true;
    this.input.clear();
    this.clock.rebase();
    this.randomSource = null;
    this.clearProjectiles();
    this.clearEnemies();
    this.publish();
    this.listeners.clear();
  }
}
