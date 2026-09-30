import { Assets, Texture } from 'pixi.js';
import waterUrl from '../../../assets/png/retina/tiles/tile_73.png?url';
import playerUrl from '../../../assets/png/default/ships/ship_2.png?url';
import environmentUrl from '../../../assets/tilesheet/tiles_sheet.png?url';
import projectileUrl from '../../../assets/png/default/ship_parts/cannon_ball.png?url&no-inline';

import chaserUrl from '../../../assets/png/default/ships/ship_3.png?url';
import shooterUrl from '../../../assets/png/default/ships/ship_1.png?url';

interface FoundationAsset {
  src: string;
  data: { resolution: number };
}

export const FOUNDATION_ASSETS = {
  chaser: { src: chaserUrl, data: { resolution: 1 } },
  shooter: { src: shooterUrl, data: { resolution: 1 } },
  water: { src: waterUrl, data: { resolution: 2 } },
  // Default/retina ship_2 are identical 66×113 files, not separate density variants.
  player: { src: playerUrl, data: { resolution: 1 } },
  environment: { src: environmentUrl, data: { resolution: 1 } },
  projectile: { src: projectileUrl, data: { resolution: 1 } },
} satisfies Record<'water' | 'player' | 'environment' | 'projectile' | 'chaser' | 'shooter', FoundationAsset>;

interface FoundationTextures { chaser: Texture; shooter: Texture; water: Texture; player: Texture; environment: Texture; projectile: Texture }

let textures: FoundationTextures | null = null;
let pending: Promise<FoundationTextures> | null = null;
let progress = 0;
const subscribers = new Set<(progress: number) => void>();

function publishProgress(value: number) {
  progress = value;
  for (const subscriber of subscribers) subscriber(value);
}

// The small, shared asset cache outlives a renderer. Unmount only removes its subscription.
export async function loadFoundationTextures(onProgress: (progress: number) => void, signal: AbortSignal): Promise<FoundationTextures> {
  if (textures) {
    if (!signal.aborted) onProgress(1);
    return textures;
  }

  function unsubscribe() {
    subscribers.delete(onProgress);
    signal.removeEventListener('abort', unsubscribe);
  }

  if (!signal.aborted) {
    subscribers.add(onProgress);
    signal.addEventListener('abort', unsubscribe, { once: true });
    onProgress(progress);
  }

  if (!pending) {
    publishProgress(0);
    const assetProgress = { chaser: 0, shooter: 0, water: 0, player: 0, environment: 0, projectile: 0 };
    function load(name: keyof FoundationTextures) {
      return Assets.load<Texture>(FOUNDATION_ASSETS[name], {
        onProgress: (value) => {
          assetProgress[name] = value;
          publishProgress(Object.values(assetProgress).reduce((sum, value) => sum + value, 0) / 6);
        },
        strategy: 'throw',
      }).then((texture) => {
        if (!(texture instanceof Texture)) throw new Error(`The ${name} asset is not a texture.`);
        return texture;
      });
    }
    // Wait for all requests to settle before retrying, even if one fails first.
    pending = Promise.allSettled([load('water'), load('player'), load('environment'), load('projectile'), load('chaser'), load('shooter')]).then(([water, player, environment, projectile, chaser, shooter]) => {
      if (water.status === 'rejected') throw water.reason;
      if (player.status === 'rejected') throw player.reason;
      if (environment.status === 'rejected') throw environment.reason;
      if (projectile.status === 'rejected') throw projectile.reason;
      if (chaser.status === 'rejected') throw chaser.reason;
      if (shooter.status === 'rejected') throw shooter.reason;
      const loaded = { chaser: chaser.value, shooter: shooter.value, water: water.value, player: player.value, environment: environment.value, projectile: projectile.value };
      textures = loaded;
      return loaded;
    }).finally(() => {
      pending = null;
      if (!textures) progress = 0;
    });
  }

  try {
    return await pending;
  } finally {
    unsubscribe();
  }
}
