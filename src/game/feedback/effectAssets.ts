import { Assets, Texture, Rectangle } from 'pixi.js';
import atlasUrl from '../../../assets/spritesheet/ships_miscellaneous_sheet.png';

// Frames inspected in the supplied XML. Shared frame wrappers live with the asset cache.
let pending: Promise<EffectTextures> | null = null;
export interface EffectTextures { explosion: Texture; impact: Texture; fire: Texture }
export function loadEffectTextures(): Promise<EffectTextures> {
  pending ??= Assets.load<Texture>(atlasUrl).then((atlas) => ({
    explosion: new Texture({ source: atlas.source, frame: new Rectangle(0, 0, 74, 75) }),
    impact: new Texture({ source: atlas.source, frame: new Rectangle(544, 426, 42, 41) }),
    fire: new Texture({ source: atlas.source, frame: new Rectangle(614, 466, 18, 39) }),
  })).catch((error: unknown) => { pending = null; throw error; });
  return pending;
}

