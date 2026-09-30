/* global window, document, navigator, matchMedia, Image, getComputedStyle, innerWidth, console, process */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const evidence = [];
const errors = [];
await mkdir('output/playwright', { recursive: true });
for (const viewport of [{ width: 1280, height: 720 }, { width: 393, height: 727 }, { width: 740, height: 360 }, { width: 568, height: 320 }]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
    isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.PROFILE_URL ?? 'http://127.0.0.1:4173');
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor();
  async function audit(screen) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    // In this Chromium build full-page capture resets coarse-pointer emulation.
    // Viewport captures preserve the actual mobile input/layout conditions.
    await page.screenshot({ path: `output/playwright/task-17-${screen}-${viewport.width}.png` });
    const text = await page.evaluate(() => {
      const result = [];
      const walker = document.createTreeWalker(document.body, 4);
      while (walker.nextNode()) {
        const node = walker.currentNode, parent = node.parentElement;
        if (!parent || !node.textContent.trim() || parent.closest('.sr-only, script, style')) continue;
        const dialog = document.querySelector('dialog[open]');
        if (dialog && !dialog.contains(parent)) continue;
        if (parent.closest('details:not([open])') && !parent.closest('summary')) continue;
        const header = parent.closest('thead');
        if (header && getComputedStyle(header).clipPath !== 'none') continue;
        const style = getComputedStyle(parent);
        if (style.visibility !== 'visible' || style.clipPath !== 'none') continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > window.innerHeight) continue;
          result.push({ text: node.textContent.trim(), color: style.color,
            large: parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700),
            disabled: Boolean(parent.closest(':disabled')), rect: { x: r.x, y: r.y, width: r.width, height: r.height } });
        }
      }
      return result;
    });
    const hidden = await page.addStyleTag({ content: '* { color: transparent !important; text-shadow: none !important; }' });
    const backdrop = await page.screenshot();
    await writeFile(`output/playwright/task-17-backdrop-${screen}-${viewport.width}.png`, backdrop);
    await hidden.evaluate(el => el.remove());
    const contrast = await page.evaluate(async ({ text, backdrop }) => {
      const img = new Image(); img.src = `data:image/png;base64,${backdrop}`; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const luminance = rgb => rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      return text.map(item => {
        const fg = luminance(item.color.match(/[\d.]+/g).slice(0, 3).map(Number));
        let minimum = Infinity;
        const r = item.rect;
        // Sample the central ink band; line boxes include empty ascender/descender
        // space that can overlap decorative button borders outside the glyphs.
        for (let y = Math.max(0, Math.ceil(r.y + r.height * .3)); y < Math.min(img.height, r.y + r.height * .7); y += 2) {
          for (let x = Math.max(0, Math.ceil(r.x)); x < Math.min(img.width, r.x + r.width); x += 2) {
            const index = (y * img.width + x) * 4;
            const bg = luminance(Array.from(pixels.slice(index, index + 3)));
            minimum = Math.min(minimum, (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05));
          }
        }
        return { text: item.text, ratio: Number.isFinite(minimum) ? minimum : null,
          target: item.large ? 3 : 4.5, disabled: item.disabled };
      });
    }, { text, backdrop: backdrop.toString('base64') });
    const semantics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
      buttons: [...document.querySelectorAll('button')].filter(b => b.getClientRects().length).map(b => ({
        name: b.getAttribute('aria-label') || b.textContent.trim(), width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height })),
      headings: [...document.querySelectorAll('h1,h2')].map(h => h.textContent),
      tables: document.querySelectorAll('table caption').length, language: document.documentElement.lang,
      coarsePointer: matchMedia('(pointer: coarse)').matches, touchPoints: navigator.maxTouchPoints }));
    if (viewport.width < 768 && !semantics.coarsePointer) throw new Error('Mobile audit lost coarse-pointer emulation');
    const accessibleTree = await page.getByRole('main').ariaSnapshot();
    evidence.push({ viewport, screen, contrast, semantics, accessibleTree });
  }
  await audit('menu');
  for (const screen of ['Options', 'Ranking', 'Match History']) {
    await page.getByRole('button', { name: screen, exact: true }).click();
    await page.getByRole('heading', { name: screen, exact: true }).waitFor();
    if (screen !== 'Options') await page.locator('tbody tr').first().waitFor();
    if (screen === 'Options') {
      await page.getByRole('textbox', { name: 'Game session time' }).fill('59');
      await page.getByRole('button', { name: 'Save Changes' }).click();
    }
    await audit(screen.toLowerCase().replaceAll(' ', '-'));
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Start Match' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor();
  await audit('pause');
  await page.getByRole('dialog').getByRole('button', { name: 'Resume' }).click();
  await audit('game');
  await page.getByRole('heading', { name: 'Battle Complete' }).waitFor({ timeout: 30000 });
  await audit('result');
  await page.keyboard.press('Tab');
  const again = page.getByRole('button', { name: 'Play Again', exact: true });
  if (!await again.evaluate(button => button === document.activeElement && getComputedStyle(button).outlineStyle !== 'none')) {
    throw new Error('Result Play Again must receive visible keyboard focus');
  }
  await page.keyboard.press('Tab');
  const home = page.getByRole('button', { name: 'Main Menu', exact: true });
  if (!await home.evaluate(button => button === document.activeElement)) throw new Error('Result keyboard focus order');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Pirate Battle', exact: true }).waitFor();
  evidence.push({ viewport, screen: 'result-keyboard', checks: { playAgainFocusVisible: true, mainMenuTabOrder: true, enterReturnsToMenu: true } });
  await context.close();
}
await writeFile('output/playwright/task-17-accessibility.json', JSON.stringify({ evidence, errors }, null, 2));
console.log(JSON.stringify(evidence.filter(e => e.contrast).map(e => ({ screen: e.screen, viewport: e.viewport,
  overflow: e.semantics.overflow, failures: e.contrast.filter(c => !c.disabled && c.ratio !== null && c.ratio < c.target) })), null, 2));
await browser.close();
if (errors.length || evidence.some(e => e.semantics?.overflow || e.contrast?.some(c => !c.disabled && c.ratio !== null && c.ratio < c.target))) process.exitCode = 1;
