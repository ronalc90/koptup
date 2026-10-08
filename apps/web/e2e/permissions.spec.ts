import { Api, HAS_API, NEEDS_API, prospectWithAccess } from './support/backend';
import { expect, test } from './support/fixtures';

/**
 * Permisos verificados en el SERVIDOR (middleware de Next + backend), no solo
 * en la interfaz:
 *  - un prospecto (cuenta creada al aprobar una demo) no entra al panel /admin;
 *  - un visitante sin sesión no entra al portal /dashboard;
 *  - una demo privada sin acceso muestra la pantalla de acceso, también con
 *    sesión, y el backend dice que no.
 * Las peticiones "sin navegador" (fixture `request`) prueban que el servidor
 * responde con la redirección: el HTML del panel nunca llega.
 */

test.describe('permisos en el servidor', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('un prospecto no entra a /admin: el servidor lo manda a Mis demos', async ({ newActor, request, baseURL }) => {
    const prospect = await prospectWithAccess(['erp']);
    expect(prospect.user.role).toBe('prospect');

    for (const path of ['/admin', '/admin/solicitudes', '/admin/catalogo-demos']) {
      const res = await request.get(path, { maxRedirects: 0, headers: { cookie: `accessToken=${prospect.accessToken}` } });
      expect(res.status(), `${path} con sesión de prospecto`).toBe(307);
      expect(new URL(res.headers().location, baseURL).pathname).toBe('/dashboard/demos');
    }

    // El backend tampoco le da los datos del panel.
    const api = await Api.open();
    try {
      await expect(api.findRequestByEmail(prospect.accessToken, prospect.user.email)).rejects.toThrow(/respondió 403/);
    } finally {
      await api.dispose();
    }

    // En el navegador: termina en Mis demos con su demo.
    const { page, errors } = await newActor({ session: prospect });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard\/demos$/);
    await expect(page.locator('[data-grant="erp"] [data-status="activa"]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('un visitante sin sesión no entra a /dashboard: el servidor lo manda al login', async ({ page, request, baseURL }) => {
    for (const path of ['/dashboard', '/dashboard/demos']) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} sin sesión`).toBe(307);
      const location = new URL(res.headers().location, baseURL);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('redirect')).toBe(path);
    }

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('una demo privada sin acceso muestra la pantalla de acceso, también con sesión', async ({ newActor }) => {
    // Tiene acceso a erp (por solicitud), no a cuentas-medicas (privada).
    const prospect = await prospectWithAccess(['erp']);
    const { page, errors } = await newActor({ session: prospect });

    const response = await page.goto('/demo/cuentas-medicas');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toBe('noindex');
    await expect(page).toHaveURL(/\/demo\/cuentas-medicas$/);
    await expect(page.locator('[data-access-reason="sin_acceso"]')).toBeVisible();
    await expect(page.locator('[data-access-mode="privado"]').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Solicitar demo personalizada' })).toHaveAttribute('href', '/solicitar-demo?demos=cuentas-medicas');

    // El backend dice lo mismo: sin acceso a la privada, con acceso a la suya.
    const api = await Api.open();
    try {
      expect(await api.demoAccess('cuentas-medicas', prospect.accessToken)).toMatchObject({ allowed: false, reason: 'sin_acceso', accessMode: 'privado' });
      expect(await api.demoAccess('erp', prospect.accessToken)).toMatchObject({ allowed: true });
    } finally {
      await api.dispose();
    }

    // Su demo sí abre.
    await page.goto('/demo/erp');
    await expect(page.locator('[data-access-reason]')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
