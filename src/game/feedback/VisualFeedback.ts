import { Container, Sprite } from 'pixi.js';
import type { FeedbackEvent } from '../core/FeedbackEvent';
import type { EffectTextures } from './effectAssets';

export class VisualFeedback extends Container {
  private readonly temporary: { sprite: Sprite; time: number; duration: number }[] = [];
  private readonly deterioration = new Map<number, Sprite>();
  constructor(private readonly textures: EffectTextures) {
    super(); this.label = 'feedback'; this.eventMode = 'none';
  }
  react(event: FeedbackEvent) {
    // Bound presentation cost even under dense broadsides; never drop domain events.
    if (this.temporary.length >= 48) this.temporary.shift()?.sprite.destroy();
    const texture = event.kind === 'destruction' ? this.textures.explosion : this.textures.impact;
    const sprite = new Sprite({ texture, anchor: 0.5 });
    sprite.label = `feedback:${event.kind}`;
    sprite.position.set(event.x, event.y);
    sprite.scale.set(event.kind === 'fire' ? 0.3 : event.kind === 'destruction' ? 1 : 0.55);
    this.addChild(sprite);
    this.temporary.push({ sprite, time: event.time, duration: event.kind === 'destruction' ? 0.55 : 0.18 });
  }
  sync(time: number, ships: readonly { id: number; x: number; y: number; ratio: number }[]) {
    for (let i = this.temporary.length - 1; i >= 0; i--) {
      const effect = this.temporary[i];
      const age = Math.max(0, time - effect.time);
      if (age >= effect.duration) { effect.sprite.destroy(); this.temporary.splice(i, 1); }
      else effect.sprite.alpha = 1 - age / effect.duration;
    }
    const ids = new Set<number>();
    for (const ship of ships) {
      if (ship.ratio > 0.5 || ship.ratio <= 0) continue;
      ids.add(ship.id);
      let sprite = this.deterioration.get(ship.id);
      if (!sprite) {
        sprite = new Sprite({ texture: this.textures.fire, anchor: { x: 0.5, y: 1 } });
        sprite.label = `deterioration:${ship.id}`;
        this.deterioration.set(ship.id, sprite); this.addChild(sprite);
      }
      sprite.position.set(ship.x, ship.y);
      sprite.scale.set(ship.ratio <= 0.25 ? 1 : 0.7);
    }
    for (const [id, sprite] of this.deterioration) {
      if (!ids.has(id)) { sprite.destroy(); this.deterioration.delete(id); }
    }
  }
  clear() {
    for (const effect of this.temporary) effect.sprite.destroy();
    this.temporary.length = 0;
    for (const sprite of this.deterioration.values()) sprite.destroy();
    this.deterioration.clear();
  }
  override destroy() { this.clear(); super.destroy({ children: true }); }
}
