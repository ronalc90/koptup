import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { collectBrowserErrors, VISIBLE_ERROR_TEXTS } from './support/browser-errors';

/**
 * Humo de todas las demos en un navegador real (locale es-CO, ver
 * playwright.config.ts): el catálogo /demo y cada /demo/<slug> (la lista sale
 * de las carpetas de src/app/demo).
 *
 * 1. Responde 200, tiene título y no muestra textos de error.
 * 2. No registra errores en la consola (incluidos los de hidratación de React
 *    #418/#423/#425) ni excepciones sin capturar.
 */
const DEMO_DIR = path.join(__dirname, '..', 'src', 'app', 'demo');

const slugs = fs
  .readdirSync(DEMO_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DEMO_DIR, entry.name, 'page.tsx')))
  .map((entry) => entry.name)
  .sort();

/**
 * Errores de hidratación de React. En la build de producción llegan como
 * "Minified React error #418/#423/#425"; en desarrollo, con su texto completo.
 */
const HYDRATION_ERROR = /Minified React error #(418|423|425)\b|Hydration failed|did not match|while hydrating|server-rendered HTML/i;

/**
 * Demos con errores de consola conocidos. Cada entrada es un bug real de la
 * demo, no de la prueba, y la prueba la sigue vigilando:
 * - falla si aparece cualquier error que no coincida con `patron` (un error
 *   nuevo nunca queda tapado por la lista);
 * - falla si el error conocido ya no ocurre, para que se borre la entrada
 *   (la lista solo se achica), salvo que sea `intermitente`: entonces solo
 *   deja una anotación "problema conocido no apareció" en el reporte.
 * Para exigir cero errores también en estas demos:
 * E2E_INCLUDE_KNOWN_ISSUES=1 npm run test:e2e
 */
interface KnownIssue {
  motivo: string;
  patron: RegExp;
  /** El error no sale en todas las cargas: no se exige que aparezca. */
  intermitente?: boolean;
}

// Intermitente: con 10 cargas seguidas por demo, automatizacion, chatbot,
// facturacion-electronica y pos cargaron alguna vez sin el error (depende de
// qué alcanza a pintarse antes de hidratar), y exigirlo hacía fallar la
// prueba al azar.
const HYDRATION_TO_LOCALE: KnownIssue = {
  motivo:
    'hidratación (#418/#423/#425) con el navegador en es-CO: la página formatea números o fechas con toLocaleString() sin locale y el servidor no pinta lo mismo que el navegador',
  patron: HYDRATION_ERROR,
  intermitente: true,
};

// Demos cuyas APIs exigen sesión o acceso desde P3 (autorización en el
// servidor). Un visitante anónimo recibe 401 del backend hasta que la demo
// muestre su pantalla de acceso (P4: «Solicita acceso» con DemoGrant) o, en
// gestor-documentos, pida iniciar sesión (pista demos). cuentas-medicas
// además debe enviar la sesión con `authFetch` de src/lib/auth-token.ts
// (pista demos) para funcionar con una cuenta con acceso.
const ACCESS_REQUIRED: KnownIssue = {
  motivo:
    'la API de la demo exige sesión o acceso (P3); falta la pantalla de acceso (P4) / pedir inicio de sesión (pista demos), así que el anónimo ve 401 en consola',
  patron: /status of 40[13]|Error al cargar|Error al obtener|Error fetching/i,
  // Las llamadas salen en un efecto tras hidratar: según el tiempo de carga
  // pueden quedar fuera de la espera de la prueba.
  intermitente: true,
};

const KNOWN_CONSOLE_ISSUES: Record<string, KnownIssue> = {
  // pendiente P4 + pista demos: pantalla de acceso y authFetch (ver ACCESS_REQUIRED).
  'cuentas-medicas': ACCESS_REQUIRED,
  // pendiente pista demos: con 401 mostrar «inicia sesión» (useDocuments expone
  // `requiresLogin`) o un corpus de muestra, en lugar del error genérico.
  'gestor-documentos': ACCESS_REQUIRED,
  // pendiente P4: pantalla de acceso (demo privada).
  'sistema-experto': ACCESS_REQUIRED,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  automatizacion: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  chatbot: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'facturacion-electronica': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'helpdesk-ia': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  lms: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  loyalty: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'moderacion-contenido': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  pos: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  scraping: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'wms-logistica': HYDRATION_TO_LOCALE,
};

/**
 * Textos de error visibles conocidos (misma regla que KNOWN_CONSOLE_ISSUES:
 * cada entrada es un pendiente real y la lista solo se achica).
 */
const KNOWN_VISIBLE_ISSUES: Record<string, { motivo: string; textos: string[] }> = {
  // pendiente P4 + pista demos: sin acceso, la demo muestra su error en lugar de «Solicita acceso».
  'cuentas-medicas': { motivo: ACCESS_REQUIRED.motivo, textos: ['Error al cargar', 'No se pudieron cargar', 'Verifique que el servidor'] },
  // pendiente pista demos: pedir inicio de sesión antes de cargar documentos.
  'gestor-documentos': { motivo: ACCESS_REQUIRED.motivo, textos: ['Error al cargar'] },
};

const STRICT = Boolean(process.env.E2E_INCLUDE_KNOWN_ISSUES);

const ROUTES = [
  { route: '/demo', slug: '' },
  ...slugs.map((slug) => ({ route: `/demo/${slug}`, slug })),
];

for (const { route, slug } of ROUTES) {
  test.describe(route, () => {
    test('responde 200 y no muestra errores', async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'load' });
      expect(response, `sin respuesta para ${route}`).not.toBeNull();
      expect(response!.status()).toBe(200);
      await expect(page).toHaveTitle(/KopTup/);

      // Hidratación y efectos iniciales (peticiones al backend incluidas).
      await page.waitForLoadState('networkidle');

      const body = await page.locator('body').innerText();
      const knownVisible = STRICT ? undefined : KNOWN_VISIBLE_ISSUES[slug];
      if (knownVisible) {
        test.info().annotations.push({ type: 'problema conocido', description: `pendiente: ${knownVisible.motivo}` });
      }
      for (const text of VISIBLE_ERROR_TEXTS) {
        if (knownVisible?.textos.includes(text)) continue;
        expect(body, `${route} muestra "${text}"`).not.toContain(text);
      }
    });

    test('sin errores en la consola del navegador', async ({ page }) => {
      const errors = collectBrowserErrors(page);
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');

      const known = STRICT ? undefined : KNOWN_CONSOLE_ISSUES[slug];
      if (!known) {
        expect(errors, `errores en el navegador al abrir ${route}`).toEqual([]);
        return;
      }

      // Problema conocido (ver el comentario "pendiente pista demos" de la entrada).
      test.info().annotations.push({ type: 'problema conocido', description: `pendiente pista demos: ${known.motivo}` });
      const unexpected = errors.filter((error) => !known.patron.test(error));
      expect(unexpected, `errores nuevos (fuera del problema conocido) al abrir ${route}`).toEqual([]);
      if (known.intermitente) {
        if (errors.length === 0) {
          test.info().annotations.push({ type: 'problema conocido no apareció', description: `${route} (intermitente)` });
        }
        return;
      }
      expect(
        errors.length,
        `${route} ya no registra el problema conocido: borra "${slug}" de KNOWN_CONSOLE_ISSUES en e2e/demos.spec.ts`,
      ).toBeGreaterThan(0);
    });
  });
}

test('la lista de problemas conocidos solo nombra demos que existen', () => {
  for (const slug of [...Object.keys(KNOWN_CONSOLE_ISSUES), ...Object.keys(KNOWN_VISIBLE_ISSUES)]) {
    expect(slugs, `KNOWN_CONSOLE_ISSUES nombra "${slug}", que no existe`).toContain(slug);
  }
});
