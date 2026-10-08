import { devices, expect, test as base, type BrowserContext, type BrowserContextOptions, type Page, type TestInfo } from '@playwright/test';
import { API_URL, visitorIp, type Session } from './backend';
import { collectBrowserErrors } from './browser-errors';

/**
 * Fixtures de las pruebas de la plataforma (solicitud de demos, panel,
 * portal, contacto, demo RAG):
 *
 * - `page`: la página de siempre, pero como un visitante con IP propia hacia
 *   el backend (ver support/backend.ts › "Visitantes distintos").
 * - `newActor({ session, device })`: otra persona en su propio navegador
 *   (contexto aislado), con o sin sesión. `device: 'desktop'` la pone en un
 *   escritorio aunque el proyecto sea el móvil (el equipo de KopTup usa el
 *   panel en el computador; el prospecto puede venir del celular). Cada actor
 *   junta sus errores de consola en `errors`.
 */

export interface Actor {
  page: Page;
  context: BrowserContext;
  errors: string[];
}

export interface ActorOptions {
  session?: Session;
  device?: 'project' | 'desktop';
}

const ACCESS_COOKIE_MAX_AGE_S = 15 * 60;
const REFRESH_COOKIE_MAX_AGE_S = 7 * 24 * 60 * 60;

/**
 * Lo mismo que deja el login de la web (lib/api.ts y app/login): las cookies
 * `accessToken` y `refreshToken` del dominio de la web y el usuario en
 * localStorage (solo para la interfaz; el servidor decide con las cookies).
 */
export function sessionStorageState(baseURL: string, session: Session): Exclude<BrowserContextOptions['storageState'], string | undefined> {
  const url = new URL(baseURL);
  const now = Math.floor(Date.now() / 1000);
  const cookie = (name: string, value: string, maxAge: number) => ({
    name,
    value,
    domain: url.hostname,
    path: '/',
    expires: now + maxAge,
    httpOnly: false,
    secure: url.protocol === 'https:',
    sameSite: 'Lax' as const,
  });
  return {
    cookies: [
      cookie('accessToken', session.accessToken, ACCESS_COOKIE_MAX_AGE_S),
      cookie('refreshToken', session.refreshToken, REFRESH_COOKIE_MAX_AGE_S),
    ],
    origins: [{ origin: url.origin, localStorage: [{ name: 'user', value: JSON.stringify(session.user) }] }],
  };
}

/** Las peticiones de este contexto al backend salen con la IP `ip`. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** ¿`url` va al backend? (localhost y 127.0.0.1 cuentan como el mismo host). */
function isBackendUrl(url: URL, api: URL): boolean {
  if (url.protocol !== api.protocol || url.port !== api.port) return false;
  return url.hostname === api.hostname || (LOOPBACK_HOSTS.has(url.hostname) && LOOPBACK_HOSTS.has(api.hostname));
}

export async function actAsVisitor(context: BrowserContext, ip: string = visitorIp()): Promise<void> {
  if (!API_URL) return;
  const api = new URL(API_URL);
  await context.route(
    (url) => isBackendUrl(url, api),
    async (route) => {
      const headers = { ...(await route.request().allHeaders()), 'x-forwarded-for': ip };
      await route.continue({ headers });
    },
  );
}

function baseURLOf(testInfo: TestInfo): string {
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) throw new Error('playwright.config.ts no define baseURL');
  return baseURL;
}

/** Opciones de navegador del proyecto (escritorio o móvil) o de un escritorio. */
function contextOptionsFor(testInfo: TestInfo, device: ActorOptions['device']): BrowserContextOptions {
  const use = testInfo.project.use;
  const common: BrowserContextOptions = { baseURL: use.baseURL, locale: use.locale };
  if (device === 'desktop') {
    const { defaultBrowserType: _ignored, ...desktop } = devices['Desktop Chrome'];
    return { ...desktop, ...common, viewport: { width: 1440, height: 900 } };
  }
  return {
    ...common,
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
  };
}

export const test = base.extend<{
  newActor: (options?: ActorOptions) => Promise<Actor>;
}>({
  page: async ({ page }, use) => {
    await actAsVisitor(page.context());
    await use(page);
  },
  newActor: async ({ browser }, use, testInfo) => {
    const contexts: BrowserContext[] = [];
    await use(async ({ session, device = 'project' } = {}) => {
      const context = await browser.newContext({
        ...contextOptionsFor(testInfo, device),
        storageState: session ? sessionStorageState(baseURLOf(testInfo), session) : undefined,
      });
      contexts.push(context);
      await actAsVisitor(context);
      const page = await context.newPage();
      return { page, context, errors: collectBrowserErrors(page) };
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

export { expect };
