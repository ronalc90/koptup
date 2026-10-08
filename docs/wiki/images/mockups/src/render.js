// Renderiza los mockups HTML de esta carpeta a PNG en ../ (1440 px de ancho; el email a 720 px).
// Uso (desde la raíz del repo): node docs/wiki/images/mockups/src/render.js [nombre ...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const SRC = __dirname;
const OUT = path.join(__dirname, '..');
const WIDTH = { 'email-invitacion': 720 };

(async () => {
  const names = process.argv.slice(2).length
    ? process.argv.slice(2)
    : fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
  const browser = await chromium.launch();
  for (const n of names) {
    const ctx = await browser.newContext({ viewport: { width: WIDTH[n] || 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(SRC, n + '.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: true });
    console.log('ok', n);
    await ctx.close();
  }
  await browser.close();
})();
