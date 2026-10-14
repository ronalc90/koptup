import fs from 'fs';
import { adminSession, API_URL, HAS_API, NEEDS_API, staffSession, uniqueEmail, visitorIp } from './support/backend';
import { expect, test } from './support/fixtures';
import { request as playwrightRequest } from '@playwright/test';

/**
 * Admin › Privacidad (Ley 1581): el admin busca a una persona por su email,
 * ve lo que el sistema guarda de ella, lo exporta en JSON y lo suprime con
 * confirmación escrita del email. Después la búsqueda no encuentra nada.
 */

test.describe('Admin › Privacidad', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('buscar, exportar y suprimir los datos de una persona', async ({ newActor }, testInfo) => {
    // Una persona escribe por el formulario de contacto (por la API).
    const email = uniqueEmail(`titular-${testInfo.project.name}`);
    const ctx = await playwrightRequest.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { 'X-Forwarded-For': visitorIp() } });
    try {
      const res = await ctx.post('api/contact', {
        data: { name: 'Titular E2E', email, service: 'Sistema RAG', message: 'Quiero saber qué datos guardan de mí.', consentimiento: true },
      });
      expect(res.status()).toBe(200);
    } finally {
      await ctx.dispose();
    }

    const { page, errors } = await newActor({ session: await adminSession(), device: 'desktop' });
    await page.goto('/admin/privacidad');
    await expect(page.getByRole('heading', { name: 'Privacidad: derechos del titular' })).toBeVisible();
    await expect(page.getByText(/consultas en máximo 10 días hábiles y los reclamos .* 15 días hábiles/)).toBeVisible();

    await page.fill('#privacy-email', email);
    await page.getByTestId('privacy-search').click();
    const result = page.getByTestId('privacy-result');
    await expect(result).toContainText(`Datos de ${email}`);
    await expect(result.locator('[data-category="contactos"]')).toBeVisible();
    // Con el flujo de compra apagado (COMMERCE_ENABLED sin definir, como en CI
    // y en producción) el contacto no crea un Lead.
    await expect(result.locator('[data-category="leads"]')).toHaveCount(0);
    await result.locator('[data-category="contactos"] summary').click();
    await expect(result.locator('[data-category="contactos"] pre')).toContainText('Titular E2E');

    // Exportar: descarga un JSON con los datos.
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('privacy-export').click()]);
    expect(download.suggestedFilename()).toMatch(/^datos-titular-\d{4}-\d{2}-\d{2}\.json$/);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf-8'));
    expect(exported.datos.contactos[0]).toMatchObject({ email, name: 'Titular E2E' });

    // Suprimir: el botón final solo se habilita al escribir el mismo email.
    await page.getByTestId('privacy-erase').click();
    const confirm = page.getByTestId('privacy-erase-confirm');
    await expect(confirm).toBeDisabled();
    await page.fill('#privacy-confirm', 'otro@correo.com');
    await expect(confirm).toBeDisabled();
    await page.fill('#privacy-confirm', email);
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByTestId('privacy-erased')).toContainText(/Referencia de la supresión: SUP-\d{4}-[0-9A-F]{8}/);

    // Ya no queda nada de esa persona.
    await page.getByTestId('privacy-search').click();
    await expect(page.getByTestId('privacy-result')).toContainText('No encontramos datos guardados con ese email.');
    expect(errors).toEqual([]);
  });

  test('el menú y la página son solo para el rol admin', async ({ page, newActor }) => {
    // Sin sesión, el middleware manda al inicio de sesión.
    await page.goto('/admin/privacidad');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fprivacidad/);

    // Un gerente usa el panel, pero no ve Privacidad: la página lo devuelve al
    // inicio del panel y la API le responde 403.
    const manager = await staffSession('manager', 'gerente-privacidad');
    const { page: managerPage, errors } = await newActor({ session: manager, device: 'desktop' });
    await managerPage.goto('/admin/privacidad');
    await expect(managerPage).toHaveURL(/\/admin\/?$/);
    await expect(managerPage.locator('a[href="/admin/privacidad"]')).toHaveCount(0);
    const ctx = await playwrightRequest.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { 'X-Forwarded-For': visitorIp() } });
    try {
      const res = await ctx.post('api/admin/privacy/search', { headers: { Authorization: `Bearer ${manager.accessToken}` }, data: { email: 'alguien@e2e.koptup.test' } });
      expect(res.status()).toBe(403);
    } finally {
      await ctx.dispose();
    }
    expect(errors).toEqual([]);
  });
});
