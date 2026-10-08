import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas end-to-end (Playwright).
 *
 * Corren contra un sitio ya levantado: no arrancan servidores por su cuenta.
 * - E2E_BASE_URL: URL de la web (por defecto http://localhost:3300, el
 *   puerto local de desarrollo de la pista de plataforma).
 * - E2E_API_URL (opcional): URL del backend. Si existe, también se prueba su
 *   endpoint /health.
 *
 * En CI (.github/workflows/ci.yml) el job "e2e" levanta MongoDB, Redis, el
 * mock de OpenAI (e2e/support/openai-mock.js), el backend compilado y la web
 * con `next start`, y luego ejecuta `npm run test:e2e`.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3300';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL,
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'movil',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
