import type { WeaponId } from './GameConfig';
import type { GameplayAction } from '../input/InputState';

interface WeaponLayout {
  readonly action: GameplayAction;
  readonly direction: 'forward' | 'left' | 'right';
  readonly origins: readonly Readonly<{ forward: number; side: number }>[];
}

// Logical offsets derived from the supplied 66×113 ship, never from rendered bounds.
// Positive forward points toward the bow; positive side points starboard.
export const WEAPON_LAYOUTS = Object.freeze({
  front: Object.freeze({ action: 'fireFront', direction: 'forward',
    origins: Object.freeze([Object.freeze({ forward: 60, side: 0 })]) }),
  leftBroadside: Object.freeze({ action: 'fireLeft', direction: 'left',
    origins: Object.freeze([-24, 0, 24].map((forward) => Object.freeze({ forward, side: -38 }))) }),
  rightBroadside: Object.freeze({ action: 'fireRight', direction: 'right',
    origins: Object.freeze([-24, 0, 24].map((forward) => Object.freeze({ forward, side: 38 }))) }),
} satisfies Record<WeaponId, WeaponLayout>);

// Default/retina cannon_ball are identical 10×10 artwork. Use a conservative square.
export const PROJECTILE_HALF_SIZE = 5;
