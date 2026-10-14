import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { adminSession, Api, HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Avisos al dueño de un nuevo contacto (correo por Resend y WhatsApp con la
 * plantilla de Meta), de punta a punta contra el mock local de los dos
 * proveedores (e2e/support/notify-mock.js): nada sale a un buzón ni a un
 * WhatsApp real.
 *
 * 1. Una persona escribe por /contact: el mock recibe 1 correo para
 *    NOTIFY_EMAIL con `reply_to` = su email y 1 plantilla `koptup_aviso` con
 *    2 parámetros sin saltos de línea (aunque el mensaje los tenga).
 * 2. Admin › Contactos muestra "Enviado" en ambos canales.
 * 3. Admin › Configuración muestra los dos canales configurados y el botón
 *    "Enviar aviso de prueba" devuelve "enviado" en ambos.
 *
 * Necesita, además de E2E_API_URL, el mock levantado y el backend apuntando a
 * él (ver README › Pruebas y CI): E2E_NOTIFY_MOCK_URL es la URL del mock;
 * E2E_NOTIFY_EMAIL y E2E_ADMIN_WHATSAPP_NUMBER, los destinos ficticios que
 * tiene el backend (NOTIFY_EMAIL y ADMIN_WHATSAPP_NUMBER).
 */

const MOCK_URL = (process.env.E2E_NOTIFY_MOCK_URL ?? '').trim().replace(/\/+$/, '');
const NOTIFY_EMAIL = process.env.E2E_NOTIFY_EMAIL || 'dueno@e2e.koptup.test';
const ADMIN_WHATSAPP = (process.env.E2E_ADMIN_WHATSAPP_NUMBER || '573000000000').replace(/\D/g, '');
const NEEDS_MOCK =
  'E2E_NOTIFY_MOCK_URL no está definida: esta prueba revisa los avisos en el mock de Resend y WhatsApp (e2e/support/notify-mock.js; ver README › Pruebas y CI)';

interface Captured {
  kind: 'email' | 'whatsapp';
  status: number;
  id?: string;
  headers: { bearer: boolean; userAgent: string | null; idempotencyKey: string | null };
  body: Record<string, any>;
}

async function captured(mock: APIRequestContext, kind: Captured['kind'], q: string): Promise<Captured[]> {
  const res = await mock.get('__requests', { params: { kind, q } });
  expect(res.status(), 'el mock de avisos no respondió').toBe(200);
  return ((await res.json()) as { requests: Captured[] }).requests;
}

test.describe('Avisos al dueño de un nuevo contacto', () => {
  test.skip(!HAS_API, NEEDS_API);
  test.skip(!MOCK_URL, NEEDS_MOCK);

  test('el contacto produce 1 correo y 1 WhatsApp, el panel los muestra enviados y la prueba funciona', async ({ page, newActor }, testInfo) => {
    // El panel se usa en escritorio y la prueba de avisos tiene un límite
    // estricto por cuenta: corre una vez, no en cada proyecto.
    test.skip(testInfo.project.name !== 'escritorio', 'Solo en el proyecto escritorio (el botón de prueba tiene un límite estricto).');

    const mock = await playwrightRequest.newContext({ baseURL: `${MOCK_URL}/` });
    try {
      const errors = collectBrowserErrors(page);
      const email = uniqueEmail('aviso-dueno');
      // Saltos de línea, tabs y espacios de más: la plantilla de WhatsApp no
      // los acepta en los parámetros y el backend debe limpiarlos.
      const message = 'Hola, necesitamos un asistente.\nSegunda línea\tcon tab y      espacios.\n\nTercera línea.';

      // 1. Una persona escribe por /contact.
      await page.goto('/contact');
      await page.fill('#name', 'Diana Aviso');
      await page.fill('#email', email);
      await page.fill('#company', 'Avisos E2E S.A.S.');
      await page.locator('#service').selectOption({ index: 1 });
      await page.fill('#message', message);
      await page.locator('#consentimiento').check();
      const [sent] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'),
        page.getByRole('button', { name: 'Enviar mensaje' }).click(),
      ]);
      expect(sent.status()).toBe(200);
      await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();

      // El aviso sale en segundo plano: se espera a que el mock lo reciba.
      await expect.poll(async () => (await captured(mock, 'email', email)).length, { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
      await expect.poll(async () => (await captured(mock, 'whatsapp', email)).length, { timeout: 20_000 }).toBeGreaterThanOrEqual(1);

      // Exactamente 1 correo, al dueño, con reply_to = la persona.
      const emails = await captured(mock, 'email', email);
      expect(emails, 'se esperaba 1 solo correo para este contacto').toHaveLength(1);
      const [mail] = emails;
      expect(mail.status).toBe(200);
      expect(mail.headers.bearer).toBe(true);
      // Resend responde 403 sin User-Agent; el backend manda el suyo (no el de Node por defecto).
      expect(mail.headers.userAgent).toMatch(/^koptup-backend\//);
      const to = (Array.isArray(mail.body.to) ? mail.body.to : [mail.body.to]).map((x: string) => x.toLowerCase());
      expect(to).toContain(NOTIFY_EMAIL.toLowerCase());
      const replyTo = Array.isArray(mail.body.reply_to) ? mail.body.reply_to : [mail.body.reply_to];
      expect(replyTo).toContain(email);
      expect(String(mail.body.html ?? '') + String(mail.body.text ?? '')).toContain('Diana Aviso');

      // Exactamente 1 WhatsApp: plantilla koptup_aviso con 2 parámetros limpios.
      const whatsapps = await captured(mock, 'whatsapp', email);
      expect(whatsapps, 'se esperaba 1 solo WhatsApp para este contacto').toHaveLength(1);
      const [wa] = whatsapps;
      expect(wa.status).toBe(200);
      expect(wa.headers.bearer).toBe(true);
      expect(wa.body).toMatchObject({ messaging_product: 'whatsapp', to: ADMIN_WHATSAPP, type: 'template' });
      expect(wa.body.template).toMatchObject({ name: 'koptup_aviso', language: { code: 'es' } });
      const params: Array<{ type: string; text: string }> = wa.body.template.components.flatMap(
        (c: { type: string; parameters?: Array<{ type: string; text: string }> }) => (c.type === 'body' ? c.parameters ?? [] : []),
      );
      expect(params).toHaveLength(2);
      for (const p of params) {
        expect(p.type).toBe('text');
        expect(p.text.trim()).not.toBe('');
        expect(p.text).not.toMatch(/[\n\r\t]/);
        expect(p.text).not.toMatch(/ {5,}/);
      }
      expect(params[0].text.length).toBeLessThanOrEqual(120);
      expect(params[1].text.length).toBeLessThanOrEqual(700);
      // Lleva lo que dice la política de privacidad (/privacy, 2.3): nombre,
      // empresa, email y un extracto del mensaje.
      const allText = params.map((p) => p.text).join(' | ');
      expect(allText).toContain('Diana Aviso');
      expect(allText).toContain('Avisos E2E S.A.S.');
      expect(allText).toContain(email);
      expect(allText).toContain('Hola, necesitamos un asistente.');

      // El resultado quedó guardado en el contacto (API del panel).
      const admin = await adminSession();
      const api = await Api.open();
      try {
        await expect
          .poll(async () => {
            const lead = (await api.contacts(admin.accessToken)).find((l) => l.email === email);
            return [lead?.notificaciones?.email?.estado, lead?.notificaciones?.whatsapp?.estado];
          })
          .toEqual(['enviado', 'enviado']);
      } finally {
        await api.dispose();
      }

      // 2. Admin › Contactos: "Enviado" en ambos canales, en la lista y en el detalle.
      const { page: adminPage, errors: adminErrors } = await newActor({ session: admin, device: 'desktop' });
      await adminPage.goto('/admin/contacts');
      const row = adminPage.locator(`[data-testid="contact-row"][data-contact-email="${email}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByTestId('notify-email')).toHaveAttribute('data-estado', 'enviado');
      await expect(row.getByTestId('notify-whatsapp')).toHaveAttribute('data-estado', 'enviado');
      await expect(row.getByTestId('notify-email')).toHaveText('Correo: Enviado');
      await expect(row.getByTestId('notify-whatsapp')).toHaveText('WhatsApp: Enviado');
      await row.click();
      const detail = adminPage.getByTestId('contact-notify');
      await expect(detail.getByTestId('notify-detail-email').getByTestId('notify-email')).toHaveAttribute('data-estado', 'enviado');
      await expect(detail.getByTestId('notify-detail-whatsapp').getByTestId('notify-whatsapp')).toHaveAttribute('data-estado', 'enviado');
      // Los dos ya salieron: el botón ofrece enviarlo otra vez (sin pulsarlo, para no duplicar el aviso).
      await expect(detail.getByTestId('contact-resend-notify')).toHaveText('Enviar el aviso otra vez');
      await expect(detail.getByTestId('contact-resend-notify')).toBeEnabled();

      // 3. Admin › Configuración: ambos canales configurados y la prueba sale por los dos.
      await adminPage.goto('/admin/settings');
      const card = adminPage.getByTestId('owner-notifications-card');
      await expect(card.getByRole('heading', { name: 'Avisos de nuevos contactos' })).toBeVisible();
      await expect(card.getByTestId('notify-channel-email')).toHaveAttribute('data-configurado', 'si');
      await expect(card.getByTestId('notify-channel-whatsapp')).toHaveAttribute('data-configurado', 'si');
      await expect(card.getByTestId('notify-channel-email-state')).toHaveText('Configurado');
      await expect(card.getByTestId('notify-channel-whatsapp-state')).toHaveText('Configurado');
      // Ya hubo un aviso enviado (el de este contacto, o uno anterior de la corrida).
      await expect(card.getByTestId('notify-channel-email-last-success')).not.toContainText('Ninguno todavía');
      await expect(card.getByTestId('notify-channel-whatsapp-last-success')).not.toContainText('Ninguno todavía');

      const [tested] = await Promise.all([
        adminPage.waitForResponse((r) => r.url().endsWith('/api/admin/notifications/test') && r.request().method() === 'POST'),
        card.getByTestId('notify-test-button').click(),
      ]);
      expect(tested.status()).toBe(200);
      const result = card.getByTestId('notify-test-result');
      await expect(result.getByTestId('notify-test-email')).toHaveAttribute('data-resultado', 'enviado');
      await expect(result.getByTestId('notify-test-whatsapp')).toHaveAttribute('data-resultado', 'enviado');
      await expect(result.getByTestId('notify-test-email')).toContainText('Correo: Enviado.');
      await expect(result.getByTestId('notify-test-whatsapp')).toContainText('WhatsApp: Enviado.');

      await page.waitForLoadState('networkidle');
      await adminPage.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
      expect(adminErrors).toEqual([]);
    } finally {
      await mock.dispose();
    }
  });
});
