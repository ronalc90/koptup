import { adminSession, Api, HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Flujo completo del sistema de demos (wiki 04), con la interfaz real de cada
 * persona y el backend de verdad:
 *
 *  1. Un visitante abre una demo que requiere acceso, ve la pantalla de acceso
 *     y la pide en /solicitar-demo (código DR-…).
 *  2. El admin, en Admin › Solicitudes de demo, abre la solicitud y la aprueba
 *     (14 días): el panel le muestra el enlace de activación para compartirlo.
 *  3. El prospecto abre el enlace, crea su contraseña y llega a Mis demos con
 *     la demo y los días que le quedan.
 *  4. Abre la demo desde Mis demos: el servidor lo deja pasar.
 *  5. El admin le revoca el acceso en Admin › Accesos a demos.
 *  6. En su siguiente carga la demo vuelve a mostrar la pantalla de acceso
 *     ("Acceso retirado") y Mis demos la marca como retirada.
 *
 * El visitante usa el dispositivo del proyecto (escritorio o móvil); el admin,
 * siempre un escritorio. Ninguna página registra errores de consola.
 */

const DEMO = 'erp';

test.describe('solicitud → aprobación → activación → acceso → revocación', () => {
  test.skip(!HAS_API, NEEDS_API);

  test(`el visitante pide /demo/${DEMO}, el admin la aprueba, la usa y luego se la revocan`, async ({ page, newActor }, testInfo) => {
    test.setTimeout(120_000);
    const errors = collectBrowserErrors(page);
    const email = uniqueEmail(`flujo-${testInfo.project.name}`);
    // Antes de salir de una página se deja terminar lo que Next precarga de
    // sus enlaces (prefetch): si la navegación lo corta, Next registra
    // "Failed to fetch RSC payload" en la consola aunque nada falló.
    const goto = async (path: string) => {
      await page.waitForLoadState('networkidle');
      await page.goto(path);
    };

    // 1. Visitante sin sesión: la demo pide acceso y lleva al formulario con la demo elegida.
    await page.goto(`/demo/${DEMO}`);
    await expect(page.locator('[data-access-reason="sin_sesion"]')).toBeVisible();
    await page.getByRole('link', { name: 'Solicitar acceso' }).click();
    await expect(page).toHaveURL(new RegExp(`/solicitar-demo\\?demos=${DEMO}$`));
    await expect(page.locator(`[data-demo-option="${DEMO}"][aria-pressed="true"]`)).toBeVisible();

    await page.fill('#nombre', 'Laura Prospecto');
    await page.fill('#empresa', 'Industrias E2E');
    await page.fill('#email', email);
    await page.selectOption('#pais', 'Colombia');
    await page.getByRole('radio', { name: '51-200 personas' }).click();
    await page.fill('#casoDeUso', 'Queremos ver el ERP con inventario y facturación antes de cotizar.');
    await page.check('#consentimiento');
    const [created] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/demo-requests') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar solicitud' }).click(),
    ]);
    expect(created.status()).toBe(201);
    const code = (await page.getByTestId('request-code').textContent())?.trim() ?? '';
    expect(code).toMatch(/^DR-\d{4}-[A-Z0-9]{6}$/);

    // 2. Admin: la solicitud aparece pendiente en el panel; la abre y la aprueba.
    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto(`/admin/solicitudes?q=${encodeURIComponent(email)}`);
    const row = admin.page.locator(`[data-request-code="${code}"]`);
    await expect(row.locator('[data-request-status="pendiente"]')).toBeVisible();
    await row.getByRole('button', { name: 'Revisar' }).click();
    await expect(admin.page).toHaveURL(/\/admin\/solicitudes\/[a-f0-9]{24}$/);
    await expect(admin.page.getByText(email).first()).toBeVisible();
    await expect(admin.page.locator('#approve-days')).toHaveValue('14');
    const [approved] = await Promise.all([
      admin.page.waitForResponse((r) => /\/api\/admin\/demo-requests\/[a-f0-9]{24}\/approve$/.test(r.url())),
      admin.page.getByTestId('approve-button').click(),
    ]);
    expect(approved.status()).toBe(200);
    await expect(admin.page.getByTestId('activation-link-panel')).toBeVisible();
    const activationLink = await admin.page.getByTestId('activation-link').inputValue();
    const activationPath = new URL(activationLink).pathname;
    expect(activationPath).toMatch(/^\/activar\/[A-Za-z0-9_-]{20,}$/);
    await expect(admin.page.locator('[data-request-status="aprobada"]').first()).toBeVisible();

    // 3. Prospecto: abre el enlace, crea su contraseña y llega a Mis demos.
    await goto(activationPath);
    await expect(page.getByTestId('activate-form')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hola, Laura Prospecto' })).toBeVisible();
    const password = `Clave-${Date.now()}`;
    await page.fill('#password', password);
    await page.fill('#confirm', password);
    await page.getByRole('button', { name: 'Activar mi acceso' }).click();
    await expect(page).toHaveURL(/\/dashboard\/demos/);
    const card = page.locator(`[data-grant="${DEMO}"]`);
    await expect(card.locator('[data-status="activa"]')).toBeVisible();
    await expect(card.getByText('Te quedan 14 días')).toBeVisible();

    // El enlace es de un solo uso. La validación responde 400 (token_used) y
    // el navegador lo registra en la consola: es la respuesta esperada.
    await page.waitForLoadState('networkidle');
    await page.context().clearCookies();
    const beforeUsedLink = errors.length;
    await page.goto(activationPath);
    await expect(page.locator('[data-activation-error="token_used"]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const usedLinkErrors = errors.splice(beforeUsedLink);
    expect(usedLinkErrors).toHaveLength(1);
    expect(usedLinkErrors[0]).toMatch(/status of 400 .*\/api\/auth\/activate\/check/);

    // Inicia sesión con la contraseña que creó y vuelve a Mis demos.
    await goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard\/demos/);

    // 4. Abre la demo desde Mis demos: el servidor lo deja pasar.
    await card.getByRole('link', { name: 'Abrir demo' }).click();
    await expect(page).toHaveURL(new RegExp(`/demo/${DEMO}$`));
    await expect(page.locator('[data-access-reason]')).toHaveCount(0);
    await expect(page).not.toHaveTitle(/: acceso/);
    await page.waitForLoadState('networkidle');

    // 5. Admin: revoca el acceso en Accesos a demos.
    await admin.page.goto(`/admin/accesos?q=${encodeURIComponent(email)}`);
    const grantRow = admin.page.locator(`[data-grant-row="${email}|${DEMO}"]`);
    await expect(grantRow.locator('[data-grant-status="activo"]')).toBeVisible();
    await grantRow.locator('[data-action="revoke"]').click();
    await admin.page.fill('#revoke-reason', 'Prueba e2e: fin del piloto');
    await admin.page.getByTestId('confirm-revoke').click();
    await expect(grantRow.locator('[data-grant-status="revocado"]')).toBeVisible();

    // El backend lo confirma.
    const api = await Api.open();
    try {
      const grants = await api.grantsOf((await adminSession()).accessToken, email);
      expect(grants.map((g) => [g.demoSlug, g.estadoEfectivo])).toEqual([[DEMO, 'revocado']]);
    } finally {
      await api.dispose();
    }

    // 6. Prospecto: en su siguiente carga la demo vuelve a pedir acceso.
    await page.reload();
    await expect(page.locator('[data-access-reason="revocado"]')).toBeVisible();
    await goto('/dashboard/demos');
    await expect(card.locator('[data-status="revocada"]')).toBeVisible();
    await expect(card.getByRole('link', { name: 'Abrir demo' })).toHaveCount(0);

    await page.waitForLoadState('networkidle');
    expect(errors, 'errores de consola del visitante/prospecto').toEqual([]);
    expect(admin.errors, 'errores de consola del admin').toEqual([]);
  });
});
