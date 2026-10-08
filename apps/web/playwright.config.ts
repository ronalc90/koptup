import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas end-to-end (Playwright).
 *
 * Corren contra un sitio ya levantado: no arrancan servidores por su cuenta.
 * - E2E_BASE_URL: URL de la web (por defecto http://localhost:3300, el
 *   puerto local de desarrollo de la pista de plataforma).
 * - E2E_API_URL: URL del backend al que apunta esa web. Con ella corren las
 *   pruebas de la plataforma, que siembran datos por la API (e2e/support/
 *   backend.ts): solicitud → aprobación → activación → acceso → revocación,
 *   permisos, modo de acceso desde el panel, contacto y la demo RAG con tu
 *   documento. Sin ella esas pruebas se omiten (con el motivo) y el resto
 *   corre solo contra la web.
 * - Cuenta admin para el panel: E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD, o
 *   E2E_MONGODB_URI (la base de ese backend) para que e2e/global-setup.ts cree
 *   una con contraseña al azar.
 * - Con E2E_API_URL, global-setup.ts exige que la web y el backend sean
 *   locales (siembra datos y cambia el catálogo); E2E_ALLOW_REMOTE=1 lo
 *   permite para un entorno de pruebas desechable, nunca producción.
 *
 * En CI (.github/workflows/ci.yml) el job "e2e" levanta MongoDB, Redis, el
 * mock de OpenAI (e2e/support/openai-mock.js), el backend compilado y la web
 * con `next start`, y luego ejecuta `npm run test:e2e`.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3300';
const isCI = !!process.env.CI;
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } };
/** Pruebas que cambian datos globales del sitio (proyecto "catalogo"). */
const GLOBAL_CATALOG_SPECS = /access-mode\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
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
      testIgnore: GLOBAL_CATALOG_SPECS,
      use: desktop,
    },
    {
      name: 'movil',
      testIgnore: GLOBAL_CATALOG_SPECS,
      use: { ...devices['Pixel 7'] },
    },
    // Cambia el modo de acceso de una demo en el catálogo, que es global: si
    // corriera junto a las demás pruebas, las que abren esa demo verían la
    // pantalla de acceso en lugar de la demo. Por eso corre sola, después de
    // los dos proyectos (si alguno falla, Playwright la marca como no
    // ejecutada).
    {
      name: 'catalogo',
      testMatch: GLOBAL_CATALOG_SPECS,
      dependencies: ['escritorio', 'movil'],
      use: desktop,
    },
  ],
});
