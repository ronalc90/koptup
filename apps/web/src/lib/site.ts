/**
 * Fuente única de verdad para la URL pública y la marca del sitio.
 *
 * El dominio canónico es `https://www.koptup.com` (el dominio sin www redirige
 * a www). Toda URL absoluta del sitio —metadataBase, canonical, og:url,
 * og:image, JSON-LD, sitemap y los enlaces/snippets que generan las demos—
 * debe derivar de `SITE_URL` o de `absoluteUrl()`.
 *
 * Los archivos estáticos de `public/` (robots.txt, llms.txt) no pueden importar
 * esta constante: si el dominio cambia, hay que actualizarlos a mano.
 */
export const SITE_URL = 'https://www.koptup.com';

export const SITE_NAME = 'KopTup';

/**
 * Plantilla del `<title>`: "<título de la página> | KopTup".
 * Se mantiene como literal (no derivada de SITE_NAME) para que
 * `scripts/check-titles.mjs` pueda leerla sin ejecutar TypeScript.
 */
export const TITLE_TEMPLATE = '%s | KopTup';

/** Longitud máxima del `<title>` final, sufijo incluido. */
export const MAX_TITLE_LENGTH = 60;

/** Convierte una ruta del sitio (`/services`) en URL absoluta canónica. */
export function absoluteUrl(path = ''): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
