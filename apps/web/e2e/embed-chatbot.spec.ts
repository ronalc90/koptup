import { request as playwrightRequest } from '@playwright/test';
import { API_URL, HAS_API, NEEDS_API, visitorIp } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * /embed/chatbot/<botId>: el chat que muestran widget.js y el iframe en el
 * sitio de un cliente. Se pinta solo el chat (sin el menú, el pie ni el
 * banner de cookies del sitio, y sin etiquetas de medición), responde con la
 * fuente y explica cada error según lo que respondió el servidor.
 */

const DOC = [
  'Política de devoluciones de Ferretería Andina.',
  'El plazo para devolver un producto es de 30 días calendario desde la compra, con la factura.',
  'Los productos eléctricos usados no tienen devolución, solo garantía.',
].join('\n');

async function createBotWithDoc(): Promise<string> {
  const api = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: { 'X-Forwarded-For': visitorIp() } });
  try {
    const created = await api.post('/api/chatbot/bots', { data: { name: 'Asistente de prueba e2e', languages: ['es'], welcome: '¡Hola! Pregúntame por las devoluciones.' } });
    expect(created.status(), await created.text()).toBe(201);
    const { botId, ownerToken } = (await created.json()) as { botId: string; ownerToken: string };
    const docs = await api.post(`/api/chatbot/bots/${botId}/docs`, {
      headers: { 'X-Bot-Owner-Token': ownerToken },
      data: { files: [{ name: 'devoluciones.txt', mime: 'text/plain', contentBase64: Buffer.from(DOC, 'utf8').toString('base64') }] },
    });
    expect(docs.status(), await docs.text()).toBe(201);
    return botId;
  } finally {
    await api.dispose();
  }
}

test.describe('/embed/chatbot › chat del widget', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('solo el chat: sin menú, pie ni banner; responde con la fuente', async ({ page }) => {
    const botId = await createBotWithDoc();
    const errors = collectBrowserErrors(page);
    const tracking: string[] = [];
    page.on('request', (r) => {
      if (/googletagmanager\.com|google-analytics\.com|snap\.licdn\.com/.test(r.url())) tracking.push(r.url());
    });

    await page.goto(`/embed/chatbot/${botId}?widget=1`);
    await expect(page.getByText('¡Hola! Pregúntame por las devoluciones.')).toBeVisible();

    // Nada del sitio de KopTup dentro del iframe del cliente.
    await expect(page.locator('nav')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);
    await expect(page.getByRole('region', { name: /cookies/i })).toHaveCount(0);
    // El único enlace es «Con tecnología de KopTup».
    await expect(page.locator('a[href]')).toHaveCount(1);

    await page.getByRole('textbox', { name: 'Escribe tu pregunta…' }).fill('¿Cuál es el plazo para devolver un producto?');
    const [answered] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith(`/api/chatbot/bots/${botId}/chat`)),
      page.getByRole('button', { name: 'Enviar' }).click(),
    ]);
    expect(answered.status()).toBe(200);
    expect(JSON.parse(answered.request().postData() ?? '{}')).toMatchObject({ channel: 'widget' });
    await expect(page.getByText('Fuentes', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /\[1\] devoluciones\.txt/ })).toBeVisible();

    expect(tracking).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('cada error dice lo que pasó: 429 pide esperar, 503 dice que no está disponible', async ({ page }) => {
    const botId = await createBotWithDoc();
    let status = 429;
    await page.route(`**/api/chatbot/bots/${botId}/chat`, (route) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, code: status === 429 ? 'rate_limited' : 'storage_unavailable', message: 'x' }) }),
    );
    await page.goto(`/embed/chatbot/${botId}`);
    const box = page.getByRole('textbox', { name: 'Escribe tu pregunta…' });
    await expect(box).toBeEnabled();

    await box.fill('¿Plazo de devolución?');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Espera un minuto y vuelve a intentarlo' })).toBeVisible();
    await expect(page.getByText('No pudimos conectar con el servidor')).toHaveCount(0);

    status = 503;
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'El asistente no está disponible en este momento' })).toBeVisible();
  });
});
