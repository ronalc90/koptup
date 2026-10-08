import { HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
// Con E2E_API_URL, cada prueba es un visitante con su propia IP hacia el
// backend: el formulario tiene un cupo de 5 solicitudes por IP y por hora, y
// varias corridas seguidas desde la misma máquina lo agotarían.
import { expect, test } from './support/fixtures';

/**
 * Sistema de solicitud y acceso a demos (wiki 04) visto por un visitante:
 *  - el hub /demo marca cada demo como Abierta / Requiere acceso / Solo por invitación;
 *  - una demo que requiere acceso o invitación muestra la pantalla de acceso
 *    (con la URL original, noindex y los CTA correctos) en lugar de la demo;
 *  - el formulario /solicitar-demo valida, respeta ?demos= y registra la solicitud.
 * El flujo con el panel (aprobar, activar, revocar) está en demo-flow.spec.ts,
 * los permisos en el servidor en permissions.spec.ts y el cambio de modo desde
 * el panel en access-mode.spec.ts.
 */

test.describe('acceso a demos (visitante)', () => {
  test('el hub muestra el modo de acceso de cada demo y ya no pide un código', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-demo-card="erp"] [data-access-mode="solicitud"]')).toBeVisible();
    await expect(page.locator('[data-demo-card="erp"]').getByRole('link', { name: 'Solicitar acceso' })).toBeVisible();
    await expect(page.locator('[data-demo-card="chatbot"] [data-access-mode="publico"]')).toBeVisible();
    await expect(page.locator('[data-demo-card="cuentas-medicas"] [data-access-mode="privado"]')).toBeVisible();
    await expect(page.getByText('Acceder con código')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  for (const { slug, mode, cta } of [
    { slug: 'erp', mode: 'solicitud', cta: 'Solicitar acceso' },
    { slug: 'cuentas-medicas', mode: 'privado', cta: 'Solicitar demo personalizada' },
  ]) {
    test(`/demo/${slug} sin sesión muestra la pantalla de acceso`, async ({ page }) => {
      const errors = collectBrowserErrors(page);
      const response = await page.goto(`/demo/${slug}`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['x-robots-tag']).toBe('noindex');
      await expect(page).toHaveURL(new RegExp(`/demo/${slug}$`));
      await expect(page.locator('[data-access-reason="sin_sesion"]')).toBeVisible();
      await expect(page.locator(`[data-access-mode="${mode}"]`).first()).toBeVisible();
      await expect(page.getByRole('link', { name: cta })).toHaveAttribute('href', `/solicitar-demo?demos=${slug}`);
      await expect(page.getByRole('link', { name: /Ya tengo acceso: iniciar sesión/ })).toHaveAttribute(
        'href',
        `/login?redirect=${encodeURIComponent(`/demo/${slug}`)}`,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
    });
  }

  test('una demo abierta se abre y su cierre ofrece la demo guiada con la demo elegida', async ({ page }) => {
    await page.goto('/demo/ecommerce');
    await expect(page.locator('[data-access-reason]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Solicitar demo guiada' }).first()).toHaveAttribute('href', '/solicitar-demo?demos=ecommerce');
  });
});

test.describe('/solicitar-demo', () => {
  // Registra una solicitud de verdad en el backend al que apunta la web.
  test.skip(!HAS_API, NEEDS_API);

  test('valida, respeta ?demos= y registra la solicitud', async ({ page }, testInfo) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/solicitar-demo?demos=erp,no-existe');
    await expect(page.locator('[data-demo-option="erp"][aria-pressed="true"]')).toBeVisible();
    await expect(page.locator('[data-demo-option="no-existe"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
    await expect(page.getByText(/Debes autorizar el tratamiento de tus datos/)).toBeVisible();

    await page.fill('#nombre', 'Prueba E2E');
    await page.fill('#empresa', 'Empresa E2E');
    // Dominio reservado .test: el acuse (si hay SMTP) nunca llega a un buzón real.
    await page.fill('#email', uniqueEmail(`solicitud-${testInfo.project.name}`));
    await page.selectOption('#pais', 'Colombia');
    await page.getByRole('radio', { name: '11-50 personas' }).click();
    await page.fill('#casoDeUso', 'Prueba automática del formulario de solicitud de demo.');
    await page.check('#consentimiento');
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/demo-requests') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar solicitud' }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByTestId('demo-request-success')).toBeVisible();
    await expect(page.getByTestId('request-code')).toHaveText(/^DR-\d{4}-[A-Z0-9]{6}$/);
    expect(errors).toEqual([]);
  });
});
