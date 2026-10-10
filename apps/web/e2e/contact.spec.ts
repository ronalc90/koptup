import { adminSession, Api, HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Formulario de /contact: la casilla de autorización de datos (Ley 1581) es
 * obligatoria, el envío llega al backend (POST /api/contact) con la
 * autorización y el campo trampa vacío, la persona ve la confirmación y el
 * lead queda guardado con origen "contact-form" y la prueba de la
 * autorización (lo ve el equipo en Admin › Contactos). Los errores de
 * validación del servidor se muestran junto al campo que falló.
 */

test.describe('/contact', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('pide la autorización, envía el formulario y el lead queda registrado con su prueba', async ({ page }, testInfo) => {
    const errors = collectBrowserErrors(page);
    const email = uniqueEmail(`contacto-${testInfo.project.name}`);
    const message = `Necesitamos un asistente RAG para soporte. Prueba e2e ${testInfo.project.name}.`;

    await page.goto('/contact');
    await page.fill('#name', 'Carlos Contacto');
    await page.fill('#email', email);
    await page.fill('#phone', '+57 300 123 4567');
    await page.fill('#company', 'Servicios E2E');
    await page.locator('#service').selectOption({ index: 1 });
    const service = await page.locator('#service').inputValue();
    expect(service).not.toBe('');
    await page.locator('#timeline').selectOption('1m');
    await page.fill('#message', message);

    // La casilla enlaza la política de privacidad.
    const consentLabel = page.locator('label[for="consentimiento"]');
    await expect(consentLabel).toContainText('Ley 1581 de 2012');
    await expect(consentLabel.getByRole('link', { name: 'política de privacidad' })).toHaveAttribute('href', '/privacy');

    // Sin marcarla no se envía nada: el error queda junto a la casilla.
    let posted = false;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/contact') && r.method() === 'POST') posted = true;
    });
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Revisa los campos marcados.' })).toBeVisible();
    await expect(page.locator('#consentimiento-error')).toHaveText('Marca la casilla de autorización para enviar el mensaje.');
    await expect(page.locator('#consentimiento')).toBeFocused();
    expect(posted).toBe(false);

    await page.locator('#consentimiento').check();
    await expect(page.locator('#consentimiento-error')).toHaveCount(0);
    const [sent] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ]);
    expect(sent.status()).toBe(200);
    expect(sent.request().postDataJSON()).toMatchObject({ name: 'Carlos Contacto', email, service, message, timeline: '1m', consentimiento: true, website: '' });
    await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();
    // El siguiente paso que ofrece existe (la demo), sin prometer un seguimiento que el portal no tiene.
    await expect(page.getByRole('link', { name: 'Probar la demo' })).toHaveAttribute('href', '/demo/chatbot');
    await expect(page.getByText(/seguimiento .*dashboard/i)).toHaveCount(0);

    // El lead está en la base, con su origen, su plazo y la prueba de la autorización.
    const api = await Api.open();
    try {
      const leads = await api.contacts((await adminSession()).accessToken);
      const lead = leads.find((l) => l.email === email);
      expect(lead, `no aparece el lead ${email} en /api/admin/contacts`).toBeTruthy();
      expect(lead).toMatchObject({ name: 'Carlos Contacto', service, message, source: 'contact-form', plazo: '1m' });
      expect(lead?.consentimiento).toMatchObject({ aceptado: true });
      expect(lead?.consentimiento?.versionPolitica).toBeTruthy();
    } finally {
      await api.dispose();
    }

    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('muestra junto al campo el error de validación que devuelve el servidor', async ({ page }, testInfo) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/contact');
    // 121 caracteres: el navegador lo acepta y el servidor lo rechaza.
    await page.fill('#name', 'N'.repeat(121));
    await page.fill('#email', uniqueEmail(`contacto-largo-${testInfo.project.name}`));
    await page.locator('#service').selectOption({ index: 1 });
    await page.fill('#message', 'Mensaje de prueba con un nombre demasiado largo.');
    await page.locator('#consentimiento').check();
    const [sent] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ]);
    expect(sent.status()).toBe(400);
    await expect(page.getByRole('alert').filter({ hasText: 'Revisa los campos marcados.' })).toBeVisible();
    await expect(page.locator('#name-error')).toHaveText('El nombre es muy largo (máximo 120 caracteres).');
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
    // El formulario conserva lo escrito.
    await expect(page.locator('#message')).toHaveValue('Mensaje de prueba con un nombre demasiado largo.');
    // El error de consola del 400 es esperado (respuesta del servidor); no hay otros.
    expect(errors.filter((e) => !/400 \(Bad Request\)/.test(e))).toEqual([]);
  });
});
