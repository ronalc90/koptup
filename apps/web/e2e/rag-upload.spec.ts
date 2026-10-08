import path from 'node:path';
import { HAS_API, NEEDS_API, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';
import { withoutKnownIssues } from './support/known-issues';

/**
 * /demo/chatbot › "Prueba con tu documento" de punta a punta: la página
 * consulta /api/demo-rag/status, sube un PDF real de 2 páginas
 * (e2e/fixtures/politicas-ferreteria-andina.pdf), el backend lo lee con
 * pdf-parse, lo indexa y responde con OpenAI. En CI y en local, OpenAI es el
 * mock versionado (e2e/support/openai-mock.js), que cita el primer extracto
 * que recibe, como haría el modelo.
 *
 * Requiere DEMO_UPLOAD_ENABLED=true, Redis y OPENAI_API_KEY en el backend: si
 * la demo está apagada, la prueba falla (la página mostraría "no está
 * disponible" y eso es justo lo que no se quiere dar por bueno).
 */

const PDF = path.join(__dirname, 'fixtures', 'politicas-ferreteria-andina.pdf');

test.describe('/demo/chatbot › Prueba con tu documento', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('sube un PDF, pregunta, ve la cita de la página y el contador de preguntas baja', async ({ page }, testInfo) => {
    const errors = collectBrowserErrors(page);

    await page.goto('/demo/chatbot');
    await page.waitForLoadState('networkidle');
    // La primera visita muestra el tour del Playground: se cierra como lo haría
    // una persona. El clic sirve cuando React ya hidrató la página, así que se
    // reintenta hasta que la pestaña quede elegida.
    const statusResponse = page.waitForResponse((r) => r.url().endsWith('/api/demo-rag/status'));
    const uploadTab = page.getByRole('tab', { name: /Prueba con tu documento/ });
    const skipTour = page.getByRole('dialog').getByRole('button', { name: /Saltar (tour|recorrido)/ });
    await expect(async () => {
      if (await skipTour.isVisible()) await skipTour.click();
      await uploadTab.click({ timeout: 2_000 });
      await expect(uploadTab).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    const status = await statusResponse;
    expect(await status.json(), 'la demo con documento debe estar encendida (DEMO_UPLOAD_ENABLED=true, Redis y OPENAI_API_KEY)').toMatchObject({
      enabled: true,
    });

    // Formulario: archivo, email y autorización de datos.
    await page.locator('input[type="file"]').setInputFiles(PDF);
    await expect(page.getByText('politicas-ferreteria-andina.pdf')).toBeVisible();
    await page.getByLabel('Tu email').fill(uniqueEmail(`rag-${testInfo.project.name}`));
    await page.getByRole('checkbox').check();
    const [uploaded] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/demo-rag/documents') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Subir y empezar' }).click(),
    ]);
    expect(uploaded.status(), await uploaded.text()).toBe(201);
    const { document } = (await uploaded.json()) as { document: { pages: number; kind: string; questionsRemaining: number } };
    expect(document).toMatchObject({ kind: 'pdf', pages: 2, questionsRemaining: 10 });

    // Chat sobre el documento: 0 de 10 preguntas usadas.
    await expect(page.getByText(/Listo, ya leí «politicas-ferreteria-andina\.pdf»/)).toBeVisible();
    await expect(page.getByText('Preguntas: 0/10')).toBeVisible();

    const question = '¿Cuál es el horario de soporte técnico?';
    await page.getByRole('textbox', { name: 'Pregunta algo sobre tu documento…' }).fill(question);
    const [answered] = await Promise.all([
      page.waitForResponse((r) => /\/api\/demo-rag\/documents\/[a-f0-9]{32}\/questions$/.test(r.url())),
      page.getByRole('button', { name: 'Enviar' }).click(),
    ]);
    expect(answered.status()).toBe(200);
    const answer = (await answered.json()) as { answer: string; citations: Array<{ page?: number; excerpt: string }>; questionsRemaining: number };
    // La respuesta salió del modelo (mock) y cita la página 2, donde está el horario.
    expect(answer.answer).toContain('Respuesta simulada (mock de OpenAI)');
    expect(answer.citations[0]).toMatchObject({ page: 2 });
    expect(answer.citations[0].excerpt).toContain('Horario de soporte');
    expect(answer.questionsRemaining).toBe(9);

    // En pantalla: la pregunta, la respuesta, la fuente "p. 2" con su extracto y el contador.
    await expect(page.getByText(`Tú: ${question}`)).toBeVisible();
    await expect(page.getByText(/Respuesta simulada \(mock de OpenAI\)/)).toBeVisible();
    await expect(page.getByText('Fuentes', { exact: true })).toBeVisible();
    const source = page.locator('li').filter({ hasText: 'Horario de soporte' });
    await expect(source.getByText('p. 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Preguntas: 1/10')).toBeVisible();

    await page.waitForLoadState('networkidle');
    expect(withoutKnownIssues('chatbot', errors)).toEqual([]);
  });
});
