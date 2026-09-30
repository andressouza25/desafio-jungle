import { Assets, Texture } from 'pixi.js';
import waterUrl from '../../../assets/png/retina/tiles/tile_73.png?url';
import playerUrl from '../../../assets/png/default/ships/ship_2.png?url';
import environmentUrl from '../../../assets/tilesheet/tiles_sheet.png?url';
import projectileUrl from '../../../assets/png/default/ship_parts/cannon_ball.png?url&no-inline';

interface FoundationAsset {
  src: string;
  data: { resolution: number };
}

export const FOUNDATION_ASSETS = {
  water: { src: waterUrl, data: { resolution: 2 } },
  // Default/retina ship_2 are identical 66×113 files, not separate density variants.
  player: { src: playerUrl, data: { resolution: 1 } },
  environment: { src: environmentUrl, data: { resolution: 1 } },
  projectile: { src: projectileUrl, data: { resolution: 1 } },
} satisfies Record<'water' | 'player' | 'environment' | 'projectile', FoundationAsset>;

interface FoundationTextures { water: Texture; player: Texture; environment: Texture; projectile: Texture }

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
    const assetProgress = { water: 0, player: 0, environment: 0, projectile: 0 };
    function load(name: keyof FoundationTextures) {
      return Assets.load<Texture>(FOUNDATION_ASSETS[name], {
        onProgress: (value) => {
          assetProgress[name] = value;
          publishProgress((assetProgress.water + assetProgress.player + assetProgress.environment + assetProgress.projectile) / 4);
        },
        strategy: 'throw',
      }).then((texture) => {
        if (!(texture instanceof Texture)) throw new Error(`The ${name} asset is not a texture.`);
        return texture;
      });
    }
    // Wait for all requests to settle before retrying, even if one fails first.
    pending = Promise.allSettled([load('water'), load('player'), load('environment'), load('projectile')]).then(([water, player, environment, projectile]) => {
      if (water.status === 'rejected') throw water.reason;
      if (player.status === 'rejected') throw player.reason;
      if (environment.status === 'rejected') throw environment.reason;
      if (projectile.status === 'rejected') throw projectile.reason;
      const loaded = { water: water.value, player: player.value, environment: environment.value, projectile: projectile.value };
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
