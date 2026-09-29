import { Assets, Texture } from 'pixi.js';
import waterUrl from '../../../assets/png/retina/tiles/tile_73.png?url';

interface FoundationAsset {
  src: string;
  data: { resolution: number };
}

export const FOUNDATION_ASSETS = {
  water: { src: waterUrl, data: { resolution: 2 } },
} satisfies Record<'water', FoundationAsset>;

let texture: Texture | null = null;
let pending: Promise<Texture> | null = null;
let progress = 0;
const subscribers = new Set<(progress: number) => void>();

function publishProgress(value: number) {
  progress = value;
  for (const subscriber of subscribers) subscriber(value);
}

// The small, shared asset cache outlives a renderer. Unmount only removes its subscription.
export async function loadWaterTexture(onProgress: (progress: number) => void, signal: AbortSignal): Promise<Texture> {
  if (texture) {
    if (!signal.aborted) onProgress(1);
    return texture;
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
    pending = Assets.load<Texture>(FOUNDATION_ASSETS.water, {
      onProgress: publishProgress,
      strategy: 'throw',
    }).then((loaded) => {
      if (!(loaded instanceof Texture)) throw new Error('The water asset is not a texture.');
      texture = loaded;
      return loaded;
    }).finally(() => {
      pending = null;
      if (!texture) progress = 0;
    });
  }

  try {
    return await pending;
  } finally {
    unsubscribe();
  }
}
