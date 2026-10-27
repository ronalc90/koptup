import { defineRouting } from 'next-intl/routing';

/**
 * Idiomas del sitio. El español va sin prefijo (`/about`) y el inglés con
 * `/en` (`/en/about`). Cada idioma tiene sus propias URL, así que las páginas
 * se pueden guardar en caché y los buscadores ven las dos versiones.
 *
 * `localeDetection` y `localeCookie` están apagados: el idioma sale solo de la
 * URL. Así ninguna respuesta depende de cookies ni de la cabecera
 * Accept-Language, y el selector del menú cambia de URL.
 */
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
