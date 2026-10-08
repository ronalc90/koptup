/**
 * Prueba de humo de una página: la renderiza con los proveedores reales
 * (next-intl con los mensajes reales y next-themes) y verifica que:
 * - no lanza errores al montar;
 * - pinta contenido;
 * - no usa claves de traducción inexistentes ni con formato inválido (el
 *   usuario vería la clave cruda, por ejemplo "demo.hero.title").
 */
import { act, type ComponentType } from 'react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import { renderWithProviders } from './render';
import type { TestLocale } from './messages';

export interface SmokeOptions {
  locale?: TestLocale;
}

/** Hay contenido aparte del <script> que inyecta next-themes. */
function hasRenderedContent(container: HTMLElement | null): boolean {
  if (!container) return false;
  return Array.from(container.children).some((el) => el.tagName !== 'SCRIPT');
}

function renderPage(Page: ComponentType<any>, locale: TestLocale) {
  const intlErrors: IntlError[] = [];
  const { container } = renderWithProviders(<Page />, {
    locale,
    onIntlError: (error) => {
      if (error.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) intlErrors.push(error);
    },
  });
  return { container, intlErrors };
}

function assertSmoke(container: HTMLElement, intlErrors: IntlError[], locale: TestLocale) {
  if (!hasRenderedContent(container)) {
    throw new Error('La página no renderizó contenido');
  }

  if (intlErrors.length > 0) {
    const detail = [...new Set(intlErrors.map((e) => `${e.code}: ${e.originalMessage ?? e.message}`))].join('\n  ');
    throw new Error(`La página usa traducciones inválidas (${locale}):\n  ${detail}`);
  }
}

export function smokeRenderPage(Page: ComponentType<any>, { locale = 'es' }: SmokeOptions = {}) {
  const { container, intlErrors } = renderPage(Page, locale);
  assertSmoke(container, intlErrors, locale);
  return container;
}

/**
 * Igual que smokeRenderPage, pero monta dentro de un act() asíncrono: los
 * efectos que corren justo después del primer render (promesas ya resueltas,
 * MutationObserver) se aplican antes de revisar la página, sin avisos de act.
 */
export async function smokeRenderPageAsync(Page: ComponentType<any>, { locale = 'es' }: SmokeOptions = {}) {
  let result: ReturnType<typeof renderPage> | undefined;
  await act(async () => {
    result = renderPage(Page, locale);
  });
  if (!result) throw new Error('La página no se montó');
  assertSmoke(result.container, result.intlErrors, locale);
  return result.container;
}
