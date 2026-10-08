import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { collectBrowserErrors, VISIBLE_ERROR_TEXTS } from './support/browser-errors';
import { KNOWN_CONSOLE_ISSUES, KNOWN_VISIBLE_ISSUES, STRICT } from './support/known-issues';

/**
 * Humo de todas las demos en un navegador real (locale es-CO, ver
 * playwright.config.ts): el catálogo /demo y cada /demo/<slug> (la lista sale
 * de las carpetas de src/app/demo).
 *
 * 1. Responde 200, tiene título y no muestra textos de error.
 * 2. No registra errores en la consola (incluidos los de hidratación de React
 *    #418/#423/#425) ni excepciones sin capturar.
 */
const DEMO_DIR = path.join(__dirname, '..', 'src', 'app', 'demo');

const slugs = fs
  .readdirSync(DEMO_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DEMO_DIR, entry.name, 'page.tsx')))
  .map((entry) => entry.name)
  .sort();

const ROUTES = [
  { route: '/demo', slug: '' },
  ...slugs.map((slug) => ({ route: `/demo/${slug}`, slug })),
];

for (const { route, slug } of ROUTES) {
  test.describe(route, () => {
    test('responde 200 y no muestra errores', async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'load' });
      expect(response, `sin respuesta para ${route}`).not.toBeNull();
      expect(response!.status()).toBe(200);
      await expect(page).toHaveTitle(/KopTup/);

      // Hidratación y efectos iniciales (peticiones al backend incluidas).
      await page.waitForLoadState('networkidle');

      const body = await page.locator('body').innerText();
      const knownVisible = STRICT ? undefined : KNOWN_VISIBLE_ISSUES[slug];
      if (knownVisible) {
        test.info().annotations.push({ type: 'problema conocido', description: `pendiente: ${knownVisible.motivo}` });
      }
      for (const text of VISIBLE_ERROR_TEXTS) {
        if (knownVisible?.textos.includes(text)) continue;
        expect(body, `${route} muestra "${text}"`).not.toContain(text);
      }
    });

    test('sin errores en la consola del navegador', async ({ page }) => {
      const errors = collectBrowserErrors(page);
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');

      const known = STRICT ? undefined : KNOWN_CONSOLE_ISSUES[slug];
      if (!known) {
        expect(errors, `errores en el navegador al abrir ${route}`).toEqual([]);
        return;
      }

      // Problema conocido (ver el comentario "pendiente pista demos" de la entrada).
      test.info().annotations.push({ type: 'problema conocido', description: `pendiente pista demos: ${known.motivo}` });
      const unexpected = errors.filter((error) => !known.patron.test(error));
      expect(unexpected, `errores nuevos (fuera del problema conocido) al abrir ${route}`).toEqual([]);
      if (known.intermitente) {
        if (errors.length === 0) {
          test.info().annotations.push({ type: 'problema conocido no apareció', description: `${route} (intermitente)` });
        }
        return;
      }
      expect(
        errors.length,
        `${route} ya no registra el problema conocido: borra "${slug}" de KNOWN_CONSOLE_ISSUES en e2e/support/known-issues.ts`,
      ).toBeGreaterThan(0);
    });
  });
}

test('la lista de problemas conocidos solo nombra demos que existen', () => {
  for (const slug of [...Object.keys(KNOWN_CONSOLE_ISSUES), ...Object.keys(KNOWN_VISIBLE_ISSUES)]) {
    expect(slugs, `KNOWN_CONSOLE_ISSUES nombra "${slug}", que no existe`).toContain(slug);
  }
});
