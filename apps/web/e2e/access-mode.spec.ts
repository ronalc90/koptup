import type { APIRequestContext } from '@playwright/test';
import { ACCESS_MODE_TEST_DEMO, Api, adminSession, HAS_API, NEEDS_API } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Admin › Catálogo de demos: el modo de acceso que elige el admin es el que
 * aplica el servidor al abrir /demo/<slug>.
 *
 * El middleware de la web guarda el catálogo hasta 60 s (wiki 04, §10), así
 * que la prueba espera a que el cambio llegue (máximo 90 s) consultando la
 * página sin navegador, y luego lo comprueba en el navegador.
 *
 * Cambia un dato global (el catálogo): corre una sola vez, en el proyecto
 * "catalogo" de playwright.config.ts, que arranca cuando terminan los
 * proyectos de escritorio y móvil (así ninguna otra prueba abre esta demo
 * mientras está cerrada). Siempre deja la demo abierta al terminar (también
 * si falla; global-setup.ts la repara si la corrida se cortó a mitad).
 */

const SLUG = ACCESS_MODE_TEST_DEMO;
const PROPAGATION_TIMEOUT_MS = 90_000;

/** Motivo de la pantalla de acceso que sirve el servidor, o null si sirve la demo. */
async function servedAccessReason(request: APIRequestContext): Promise<string | null> {
  const res = await request.get(`/demo/${SLUG}`, { headers: { 'Cache-Control': 'no-cache' } });
  expect(res.status()).toBe(200);
  return /data-access-reason="([a-z_]+)"/.exec(await res.text())?.[1] ?? null;
}

test.describe('modo de acceso desde el panel', () => {
  test.skip(!HAS_API, NEEDS_API);

  test(`el admin pasa /demo/${SLUG} a "Requiere acceso" y la vuelve a abrir`, async ({ page, newActor, request }) => {
    test.setTimeout(4 * 60_000);
    const errors = collectBrowserErrors(page);
    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    const api = await Api.open();

    const saveMode = async (mode: 'publico' | 'solicitud') => {
      const row = admin.page.locator(`[data-catalog-row="${SLUG}"]`);
      await row.locator(`[data-mode-select="${SLUG}"]`).selectOption(mode);
      const [saved] = await Promise.all([
        admin.page.waitForResponse((r) => r.url().endsWith(`/api/admin/demo-catalog/${SLUG}`) && r.request().method() === 'PATCH'),
        row.locator(`[data-save="${SLUG}"]`).click(),
      ]);
      expect(saved.status()).toBe(200);
      // El backend ya lo tiene.
      expect((await api.catalog()).find((c) => c.slug === SLUG)?.accessMode).toBe(mode);
    };

    try {
      // Al empezar está abierta (semilla).
      await expect.poll(() => servedAccessReason(request), { timeout: PROPAGATION_TIMEOUT_MS, intervals: [2_000, 5_000] }).toBeNull();

      // 1. El admin la pasa a "Requiere acceso".
      await admin.page.goto('/admin/catalogo-demos');
      await expect(admin.page.locator(`[data-mode-select="${SLUG}"]`)).toHaveValue('publico');
      await saveMode('solicitud');

      // 2. El servidor la cierra: un visitante ve la pantalla de acceso.
      await expect
        .poll(() => servedAccessReason(request), { timeout: PROPAGATION_TIMEOUT_MS, intervals: [2_000, 5_000] })
        .toBe('sin_sesion');
      await page.goto(`/demo/${SLUG}`);
      await expect(page.locator('[data-access-reason="sin_sesion"]')).toBeVisible();
      await expect(page.locator('[data-access-mode="solicitud"]').first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Solicitar acceso' })).toHaveAttribute('href', `/solicitar-demo?demos=${SLUG}`);

      // El catálogo público también la rotula.
      await page.waitForLoadState('networkidle');
      await page.goto('/demo');
      await expect(page.locator(`[data-demo-card="${SLUG}"] [data-access-mode="solicitud"]`)).toBeVisible();

      // 3. La vuelve a abrir.
      await saveMode('publico');
      await expect.poll(() => servedAccessReason(request), { timeout: PROPAGATION_TIMEOUT_MS, intervals: [2_000, 5_000] }).toBeNull();
      await page.waitForLoadState('networkidle');
      await page.goto(`/demo/${SLUG}`);
      await expect(page.locator('[data-access-reason]')).toHaveCount(0);
      await page.waitForLoadState('networkidle');

      expect(errors, 'errores de consola del visitante').toEqual([]);
      expect(admin.errors, 'errores de consola del admin').toEqual([]);
    } finally {
      const current = (await api.catalog()).find((c) => c.slug === SLUG);
      if (current && (current.accessMode !== 'publico' || !current.activo)) {
        await api.patchCatalog((await adminSession()).accessToken, SLUG, { accessMode: 'publico', activo: true });
      }
      await api.dispose();
    }
  });
});
