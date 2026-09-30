import { test, expect } from './helpers/fixtures';
import { prepareGame, startBattle, setOptions, readBattle } from './helpers/game';

test.beforeEach(async ({ page }, info) => { await prepareGame(page, info.title.startsWith('Chaser') ? 7 : 1); });

test('Options spawn cadence pauses with simulation and reproduces after clean restart', async ({ page }) => {
  test.setTimeout(60000); // Two full spawn timelines with controlled RAF can exceed 30s under mobile emulation.
  await setOptions(page, 60, 5); await startBattle(page);
  await page.clock.runFor(4900);
  expect((await readBattle(page)).rendered).toEqual([]);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.fastForward(10000);
  expect((await readBattle(page)).rendered).toEqual([]);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(150);
  const first = await readBattle(page);
  expect(first.rendered).toHaveLength(1);
  expect(first.snapshot.config?.spawn.intervalSeconds).toBe(5);
  await page.clock.runFor(4600);
  expect((await readBattle(page)).rendered).toHaveLength(1);
  await page.clock.runFor(450);
  expect((await readBattle(page)).rendered).toHaveLength(2);
  await page.getByRole('button', { name: 'Restart Match' }).click();
  await expect(page.getByRole('definition').nth(1)).toHaveText('0');
  expect((await readBattle(page)).rendered).toEqual([]);
  await page.clock.runFor(5050);
  const restarted = await readBattle(page);
  expect(restarted.snapshot.seed).toBe(first.snapshot.seed);
  expect(restarted.enemies.map(enemy => ({ id: enemy.id, kind: enemy.kind, health: enemy.health })))
    .toEqual(first.enemies.map(enemy => ({ id: enemy.id, kind: enemy.kind, health: enemy.health })));
  // RAF phase after Resume differs by one fixed step; compare at that documented tolerance.
  expect(Math.hypot(restarted.rendered[0].x - first.rendered[0].x, restarted.rendered[0].y - first.rendered[0].y))
    .toBeLessThanOrEqual(80 / 60 + 1e-6);
});

test('Chaser pursues a steered player and its single contact reduces health without points', async ({ page }) => {
  await startBattle(page);
  // Move to the open lower lane through real steering; no entity teleports.
  await page.keyboard.down('d'); await page.clock.runFor(Math.PI / 2.5 * 1000); await page.keyboard.up('d');
  await page.keyboard.down('w'); await page.clock.runFor(1300); await page.keyboard.up('w');
  await page.clock.runFor(3500);
  for (let step = 0; step < 60 && !(await readBattle(page)).enemies.some(enemy => enemy.kind === 'chaser'); step++) await page.clock.runFor(100);
  const first = await readBattle(page);
  const chaser = first.enemies.find(enemy => enemy.kind === 'chaser');
  if (!chaser || !first.player) throw new Error('Seed 7 must expose a Chaser in the open lane');
  expect(first.snapshot.seed).toBe(7);
  const distance = Math.hypot(chaser.x - first.player.x, chaser.y - first.player.y);
  let previousHealth = first.player.health;
  let closest = distance;
  let contact = false;
  for (let step = 0; step < 90 && !contact; step++) {
    await page.clock.runFor(100);
    const current = await readBattle(page);
    const tracked = current.enemies.find(enemy => enemy.id === chaser.id);
    if (tracked && current.player) closest = Math.min(closest, Math.hypot(tracked.x - current.player.x, tracked.y - current.player.y));
    if (!tracked) {
      contact = true;
      expect(current.player?.health).toBe(previousHealth - (current.snapshot.config?.chaser.impactDamage ?? 0));
      await expect(page.getByRole('definition').first()).toHaveText(`${current.player?.health} / 100`);
      expect(current.rendered.some(sprite => sprite.label.startsWith(`enemy:${chaser.id}:`))).toBe(false);
      await expect(page.getByRole('definition').nth(1)).toHaveText('0');
    }
    previousHealth = current.player?.health ?? 0;
  }
  expect(closest).toBeLessThan(distance - 50); expect(contact).toBe(true);
  const after = await readBattle(page);
  await page.clock.runFor(100);
  expect((await readBattle(page)).enemies.some(enemy => enemy.id === chaser.id)).toBe(false);
  expect((await readBattle(page)).snapshot.score).toBe(after.snapshot.score);
  expect((await readBattle(page)).player?.health).toBe(after.player?.health);
});

test('Shooter approaches into range, fires at the player and causes visible health loss', async ({ page }) => {
  await startBattle(page);
  await page.keyboard.down('d'); await page.clock.runFor(Math.PI / 2.5 * 1000); await page.keyboard.up('d');
  await page.keyboard.down('w'); await page.clock.runFor(1300); await page.keyboard.up('w');
  await page.clock.runFor(3500);
  const first = await readBattle(page);
  // The second seed-1 Shooter is in the open lane; the first is shielded by the island.
  const shooter = first.enemies.at(-1);
  if (shooter?.kind !== 'shooter') throw new Error('Expected open-lane Shooter');
  if (!shooter || !first.player) throw new Error('Missing seeded Shooter');
  const initialDistance = Math.hypot(shooter.x - first.player.x, shooter.y - first.player.y);
  let approached = false; let firedInRange = false; let damaged = false;
  for (let step = 0; step < 70 && !(approached && firedInRange && damaged); step++) {
    await page.clock.runFor(100);
    const current = await readBattle(page);
    const tracked = current.enemies.find(enemy => enemy.id === shooter.id);
    if (tracked && current.player) {
      const distance = Math.hypot(tracked.x - current.player.x, tracked.y - current.player.y);
      approached ||= distance < initialDistance - 20;
      firedInRange ||= distance <= (current.snapshot.config?.shooter.attackRange ?? 0) + 2
        && current.shots.some(shot => shot.weapon === 'enemy');
    }
    damaged ||= (current.player?.health ?? 100) < 100;
  }
  expect({ approached, firedInRange, damaged }).toEqual({ approached: true, firedInRange: true, damaged: true });
  const health = (await readBattle(page)).player?.health;
  await expect(page.getByRole('definition').first()).toHaveText(`${health} / 100`);
  await expect(page.getByRole('definition').nth(1)).toHaveText('0');
});
