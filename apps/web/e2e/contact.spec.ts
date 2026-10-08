import { adminSession, Api, HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Formulario de /contact: el envío llega al backend (POST /api/contact), la
 * persona ve la confirmación y el lead queda guardado con origen
 * "contact-form" (lo ve el equipo en Admin › Contactos).
 */

test.describe('/contact', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('envía el formulario y el lead queda registrado', async ({ page }, testInfo) => {
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
    await page.fill('#message', message);

    const [sent] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ]);
    expect(sent.status()).toBe(200);
    expect(sent.request().postDataJSON()).toMatchObject({ name: 'Carlos Contacto', email, service, message });
    await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();
    // El siguiente paso que ofrece existe (la demo), sin prometer un seguimiento que el portal no tiene.
    await expect(page.getByRole('link', { name: 'Probar la demo' })).toHaveAttribute('href', '/demo/chatbot');
    await expect(page.getByText(/seguimiento .*dashboard/i)).toHaveCount(0);

    // El lead está en la base, con su origen (lo que lista Admin › Contactos).
    const api = await Api.open();
    try {
      const leads = await api.contacts((await adminSession()).accessToken);
      const lead = leads.find((l) => l.email === email);
      expect(lead, `no aparece el lead ${email} en /api/admin/contacts`).toBeTruthy();
      expect(lead).toMatchObject({ name: 'Carlos Contacto', service, message, source: 'contact-form' });
    } finally {
      await api.dispose();
    }

    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
