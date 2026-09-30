export interface GameOptions {
  sessionDurationSeconds: number;
  enemySpawnIntervalSeconds: number;
}

export const OPTION_LIMITS = {
  sessionDurationSeconds: { min: 60, max: 180 },
  enemySpawnIntervalSeconds: { min: 1, max: 30 },
} as const;

export const DEFAULT_OPTIONS: Readonly<GameOptions> = Object.freeze({
  sessionDurationSeconds: 120,
  enemySpawnIntervalSeconds: 3,
});

type WeaponConfig = Readonly<{ cooldownSeconds: number }>;

export interface GameConfig {
  readonly session: Readonly<{ durationSeconds: number }>;
  readonly player: Readonly<{ health: number; movementSpeed: number; rotationSpeed: number }>;
  readonly weapons: Readonly<{ front: WeaponConfig; leftBroadside: WeaponConfig; rightBroadside: WeaponConfig }>;
  readonly projectiles: Readonly<{ speed: number; damage: number; lifetimeSeconds: number }>;
  readonly chaser: Readonly<{ health: number; movementSpeed: number; rotationSpeed: number; impactDamage: number }>;
  readonly shooter: Readonly<{ health: number; movementSpeed: number; rotationSpeed: number; attackRange: number; cooldownSeconds: number }>;
  readonly spawn: Readonly<{ intervalSeconds: number; minimumPlayerDistance: number; maxPositionAttempts: number; distribution: Readonly<{ chaser: number; shooter: number }> }>;
}

export type WeaponId = keyof GameConfig['weapons'];

export function snapshotGameConfig(config: GameConfig): GameConfig {
  const positiveValues = [
    config.session.durationSeconds, ...Object.values(config.player),
    config.weapons.front.cooldownSeconds, config.weapons.leftBroadside.cooldownSeconds, config.weapons.rightBroadside.cooldownSeconds,
    ...Object.values(config.projectiles), ...Object.values(config.chaser), ...Object.values(config.shooter), config.spawn.intervalSeconds, config.spawn.minimumPlayerDistance, config.spawn.maxPositionAttempts,
  ];
  const { chaser, shooter } = config.spawn.distribution;
  if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)
    || !Number.isInteger(config.spawn.maxPositionAttempts)
    || !Number.isFinite(chaser) || !Number.isFinite(shooter) || chaser < 0 || shooter < 0 || Math.abs(chaser + shooter - 1) > 1e-9
    || config.session.durationSeconds < OPTION_LIMITS.sessionDurationSeconds.min
    || config.session.durationSeconds > OPTION_LIMITS.sessionDurationSeconds.max
    || config.spawn.intervalSeconds < OPTION_LIMITS.enemySpawnIntervalSeconds.min
    || config.spawn.intervalSeconds > OPTION_LIMITS.enemySpawnIntervalSeconds.max) {
    throw new RangeError('Invalid game configuration.');
  }
  return Object.freeze({
    session: Object.freeze({ ...config.session }),
    player: Object.freeze({ ...config.player }),
    weapons: Object.freeze({
      front: Object.freeze({ ...config.weapons.front }),
      leftBroadside: Object.freeze({ ...config.weapons.leftBroadside }),
      rightBroadside: Object.freeze({ ...config.weapons.rightBroadside }),
    }),
    projectiles: Object.freeze({ ...config.projectiles }),
    chaser: Object.freeze({ ...config.chaser }),
    shooter: Object.freeze({ ...config.shooter }),
    spawn: Object.freeze({ ...config.spawn, distribution: Object.freeze({ ...config.spawn.distribution }) }),
  });
}

// Speeds use logical units/second; rotations use radians/second. These are
// initial balance defaults.
export const DEFAULT_GAME_CONFIG: GameConfig = snapshotGameConfig({
  session: { durationSeconds: DEFAULT_OPTIONS.sessionDurationSeconds },
  player: { health: 100, movementSpeed: 180, rotationSpeed: 2.5 },
  weapons: { front: { cooldownSeconds: 0.5 }, leftBroadside: { cooldownSeconds: 1.5 }, rightBroadside: { cooldownSeconds: 1.5 } },
  projectiles: { speed: 400, damage: 25, lifetimeSeconds: 2 },
  chaser: { health: 50, movementSpeed: 110, rotationSpeed: 2, impactDamage: 25 },
  shooter: { health: 75, movementSpeed: 80, rotationSpeed: 2, attackRange: 400, cooldownSeconds: 2 },
  spawn: { intervalSeconds: DEFAULT_OPTIONS.enemySpawnIntervalSeconds, minimumPlayerDistance: 450, maxPositionAttempts: 32, distribution: { chaser: 0.5, shooter: 0.5 } },
});
