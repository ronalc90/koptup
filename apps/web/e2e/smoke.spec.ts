import { expect, test } from '@playwright/test';
import { HOME_TITLE } from '../src/lib/site';
import { collectBrowserErrors } from './support/browser-errors';

/**
 * Humo de páginas públicas: cada página responde 200, tiene su <title>
 * correcto, muestra un único H1 y no registra errores en la consola del
 * navegador (incluidos los errores de hidratación de React #418/#423/#425)
 * ni excepciones sin capturar.
 *
 * `/services#planes-rag` es el destino de los botones de planes del sitio
 * (por ejemplo, "Quiero esto" del navbar): además se verifica que el ancla
 * exista, quede a la vista y muestre los planes con su botón de cotizar.
 */
const PAGES: Array<{ path: string; title: string; anchor?: string }> = [
  { path: '/', title: HOME_TITLE },
  // Literal de src/app/rag/page.tsx (metadata.title.absolute).
  { path: '/rag', title: 'Sistemas RAG para empresas en Colombia | KopTup' },
  // Título de src/lib/seo-config.ts ('services'); los planes RAG van arriba.
  { path: '/services#planes-rag', title: 'Precios de sistemas RAG y software a medida | KopTup', anchor: 'planes-rag' },
];

for (const { path, title, anchor } of PAGES) {
  test(`${path} carga con su título y sin errores de consola`, async ({ page }) => {
    const errors = collectBrowserErrors(page);

    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response, `sin respuesta para ${path}`).not.toBeNull();
    expect(response!.status()).toBe(200);

    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeAttached();

    if (anchor) {
      const section = page.locator(`#${anchor}`);
      await expect(section).toBeInViewport();
      // Los planes con su botón de cotizar (lleva a /contact con el plan).
      await expect(section.locator('a[href*="/contact?service=sistema-rag&plan="]').first()).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }

    // Deja terminar la hidratación y los efectos iniciales antes de revisar
    // la consola: los errores de hidratación llegan después del "load".
    await page.waitForLoadState('networkidle');

    expect(errors, `errores en el navegador al abrir ${path}`).toEqual([]);
  });
}
