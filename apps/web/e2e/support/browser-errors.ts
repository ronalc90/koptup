import type { Page } from '@playwright/test';

/**
 * Junta los errores que registra el navegador mientras la prueba usa la
 * página: console.error (incluidos los errores de hidratación de React
 * #418/#423/#425) y excepciones sin capturar (pageerror).
 */
export function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const { url, lineNumber } = msg.location();
      errors.push(`console.error: ${msg.text()}${url ? ` (${url}:${lineNumber})` : ''}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  return errors;
}

/** Textos de error que nunca deben verse en una página pública. */
export const VISIBLE_ERROR_TEXTS = [
  'Application error',
  'Error al cargar',
  'No se pudieron cargar',
  'Verifique que el servidor',
  'Internal Server Error',
];
