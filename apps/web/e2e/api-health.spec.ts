import { expect, test } from '@playwright/test';

/**
 * El backend responde. Solo corre si E2E_API_URL está definida (en CI, el job
 * "e2e" levanta el backend y la define).
 */
const apiURL = process.env.E2E_API_URL;

test.describe('backend', () => {
  test.skip(!apiURL, 'E2E_API_URL no está definida');

  test('GET /health responde 200', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'basta con un proyecto: no depende del navegador');
    const response = await request.get(`${apiURL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});
