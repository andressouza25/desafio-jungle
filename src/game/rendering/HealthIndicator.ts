import { Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import playerFrame from '../../../assets/png/default/ui/hud/health_frame.png?url';
import green from '../../../assets/png/default/ui/hud/health_fill_green.png?url';
import amber from '../../../assets/png/default/ui/hud/health_fill_amber.png?url';
import red from '../../../assets/png/default/ui/hud/health_fill_red.png?url';
import enemyFrame from '../../../assets/png/default/ui/hud/enemy_health_frame.png?url';
import enemyGreen from '../../../assets/png/default/ui/hud/enemy_health_fill_green.png?url';
import enemyRed from '../../../assets/png/default/ui/hud/enemy_health_fill_red.png?url';

export async function loadHealthTextures() {
  const [frame, healthy, warning, critical, enemy, enemyHealthy, enemyCritical] = await Promise.all(
    [playerFrame, green, amber, red, enemyFrame, enemyGreen, enemyRed].map(src => Assets.load<Texture>(src)),
  );
  return { frame, healthy, warning, critical, enemy, enemyHealthy, enemyCritical };
}
export type HealthTextures = Awaited<ReturnType<typeof loadHealthTextures>>;

// Atlas layout metadata is in logical 1x units. Cropped wrappers retain shared sources.
export class HealthIndicator extends Container {
  private readonly fill: Sprite;
  private readonly fills: readonly Texture[];
  private readonly fillWidth: number;
  constructor(textures: HealthTextures, private readonly enemy: boolean) {
    super();
    this.eventMode = 'none';
    const x = enemy ? 24 : 30; const y = enemy ? 12 : 15;
    this.fillWidth = enemy ? 112 : 196;
    this.fills = (enemy ? [textures.enemyHealthy, textures.enemyCritical, textures.enemyCritical]
      : [textures.healthy, textures.warning, textures.critical]).map(texture => new Texture({
      source: texture.source, frame: new Rectangle(x, y, this.fillWidth, enemy ? 15 : 20),
    }));
    const frame = new Sprite({ texture: enemy ? textures.enemy : textures.frame });
    this.fill = new Sprite({ texture: this.fills[0], x, y });
    this.addChild(frame, this.fill);
    this.pivot.set(enemy ? 80 : 128, enemy ? 40 : 48);
    this.scale.set(enemy ? 0.6 : 0.42);
  }
  sync(x: number, y: number, health: number, maxHealth: number) {
    const ratio = Math.max(0, Math.min(1, health / maxHealth));
    this.position.set(x, Math.max(this.enemy ? 24 : 21, y - 76));
    this.fill.texture = this.fills[ratio > 0.5 ? 0 : ratio > 0.25 ? 1 : 2];
    this.fill.width = this.fillWidth * ratio;
    this.fill.visible = ratio > 0;
  }
  override destroy() {
    super.destroy({ children: true, texture: false, textureSource: false });
    for (const texture of this.fills) texture.destroy(false);
  }
}
