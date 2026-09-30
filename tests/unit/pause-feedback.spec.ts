import { expect, test } from '@playwright/test';
import { GameController } from '../../src/game/core/GameController';
import { DEFAULT_GAME_CONFIG as defaults } from '../../src/game/config/GameConfig';
import type { FeedbackEvent } from '../../src/game/core/FeedbackEvent';
import { VisualFeedback } from '../../src/game/feedback/VisualFeedback';
import { Texture } from 'pixi.js';

function combat() {
  let index = 0;
  const sequence = [0.9, 0.5, 0];
  const controller = new GameController({ readConfig: () => ({ ...defaults, shooter: { ...defaults.shooter, health: 25 }, spawn: { ...defaults.spawn, minimumPlayerDistance: 100 } }),
    createRandom: () => ({ next: () => sequence[index++ % sequence.length] }) });
  controller.markReady(); controller.start(); controller.advance(0); return controller;
}
function steps(game: GameController, count: number) { for (let i = 0; i < count; i++) game.advance(1000 / 60); }

test('resolved combat emits immutable feedback once and subscribing cannot change outcomes', () => {
  const observed = combat(); const silent = combat(); const events: FeedbackEvent[] = [];
  const unsubscribe = observed.subscribeFeedback(event => { expect(Object.isFrozen(event)).toBe(true); events.push(event); });
  for (const game of [observed, silent]) {
    steps(game, 180); game.input.set('fireFront', true); steps(game, 100);
  }
  expect(observed.getSnapshot()).toEqual(silent.getSnapshot());
  expect(observed.getPlayerState()).toEqual(silent.getPlayerState());
  expect(observed.getProjectileStates()).toEqual(silent.getProjectileStates());
  expect(events.filter(event => event.kind === 'destruction')).toHaveLength(1);
  expect(events.some(event => event.kind === 'impact')).toBe(true);
  expect(events.some(event => event.kind === 'fire')).toBe(true);
  const count = events.length;
  observed.input.set('moveForward', true); observed.input.set('pause', true); observed.advance(16);
  const paused = observed.getSnapshot(); const player = observed.getPlayerState(); const shots = observed.getProjectileStates();
  observed.advance(60000); expect(observed.getSnapshot()).toEqual(paused);
  observed.resume(); observed.advance(60000); // Rebased clock discards stale delivery.
  steps(observed, 5);
  expect(observed.getPlayerState()).toEqual(player);
  expect(observed.getProjectileStates().length).toBe(shots.length);
  expect(events).toHaveLength(count);
  unsubscribe(); observed.input.set('fireLeft', true); steps(observed, 5); expect(events).toHaveLength(count);
  observed.destroy();
});

test('visual effects expire in simulation time, deterioration follows health, and resources are bounded and destroyed', () => {
  const effects = new VisualFeedback({ explosion: Texture.EMPTY, impact: Texture.EMPTY, fire: Texture.EMPTY });
  for (let i = 0; i < 100; i++) effects.react({ kind: 'fire', x: 10, y: 20, time: 1 });
  expect(effects.children).toHaveLength(48);
  effects.sync(1, [{ id: 1, x: 20, y: 30, ratio: 0.5 }]);
  expect(effects.children).toHaveLength(49);
  effects.sync(1, [{ id: 1, x: 40, y: 50, ratio: 0.25 }]);
  const fire = effects.children.find(child => child.label === 'deterioration:1');
  expect(fire?.position.x).toBe(40); expect(fire?.scale.x).toBe(1);
  effects.sync(2, []); expect(effects.children).toHaveLength(0); expect(fire?.destroyed).toBe(true);
  effects.react({ kind: 'destruction', x: 10, y: 20, time: 2 });
  const explosion = effects.children[0]; effects.destroy(); expect(explosion.destroyed).toBe(true);
});
